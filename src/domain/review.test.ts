import { describe, expect, it } from "vitest";
import { datasets } from "../data/synthetic";
import {
  analyze,
  changeRange,
  contiguousRanges,
  formatValue,
  initialState,
  restoreSession,
  togglePeriod,
} from "./review";

const items = datasets[0].items;
describe("public example rules", () => {
  it("routes missing forecast to a mandatory illustrative rule, not simulated AI", () => {
    const result = analyze(items.find((i) => i.kind === "missing_forecast")!);
    expect(result.decision).toBe("raise");
    expect(result.source).toBe("programmatic rule");
  });
  it("does not confuse zero with missing", () => {
    const source = items.find((i) => i.kind === "missing_forecast")!;
    const result = analyze({
      ...source,
      observations: source.observations.map((p) => ({ ...p, current: 0 })),
    });
    expect(result.source).toBe("simulated AI");
  });
  it("labels non-rule recommendations as simulated", () =>
    expect(analyze(items[0]).source).toBe("simulated AI"));
  it("does not flag an item when assessment runs", () => {
    const before = initialState(items[0]);
    analyze(items[0]);
    expect(before.raised).toBe(false);
  });
});
describe("shared selection", () => {
  it("toggles one year without duplicates", () => {
    expect(togglePeriod([2020], 2020)).toEqual([]);
    expect(togglePeriod([2021], 2020)).toEqual([2020, 2021]);
  });
  it("adds and removes a reversed drag range", () => {
    expect(changeRange([], 2023, 2021, false)).toEqual([2021, 2022, 2023]);
    expect(changeRange([2020, 2021, 2022], 2022, 2021, true)).toEqual([2020]);
  });
  it("joins adjacent periods while preserving gaps", () =>
    expect(contiguousRanges([2023, 2021, 2020, 2020])).toEqual([
      [2020, 2021],
      [2023, 2023],
    ]));
});
describe("formatting and persistence", () => {
  it("pads decimals and preserves tiny nonzero values", () => {
    expect(formatValue(1.2, 4)).toBe("1.2000");
    expect(formatValue(1e-17, 9)).toContain("e-17");
    expect(formatValue(null, 2)).toBe("\u2014");
  });
  it("isolates item IDs across datasets", () =>
    expect(
      new Set(datasets.flatMap((d) => d.items.map((i) => i.id))).size,
    ).toBe(datasets.flatMap((d) => d.items).length));
  it("rejects malformed storage and invalid ranges", () => {
    expect(restoreSession("{broken", items)).toEqual({});
    expect(
      restoreSession(
        JSON.stringify({
          [items[0].id]: { ...initialState(items[0]), range: [2030, 2014] },
        }),
        items,
      ),
    ).toEqual({});
  });
  it("restores a session without trusting stored model output", () => {
    const raw = {
      ...initialState(items[0]),
      raised: true,
      analysis: { reason: "untrusted", decision: "not_raise" },
    };
    const result = restoreSession(
      JSON.stringify({ [items[0].id]: raw }),
      items,
    )[items[0].id];
    expect(result.raised).toBe(true);
    expect(result.analysis?.reason).not.toBe("untrusted");
  });
});
