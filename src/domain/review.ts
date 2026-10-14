import type { Analysis, ItemState, ReviewItem, Session } from "./types";

export const SESSION_KEY = "raise-ai-public-demo:v1";

export function initialState(item: ReviewItem): ItemState {
  return {
    visited: false,
    raised: false,
    draft: item.defaultDraft,
    highlights: [...item.flagged],
    range: [2014, 2030],
    analysis: null,
  };
}

export function togglePeriod(periods: number[], year: number): number[] {
  return periods.includes(year)
    ? periods.filter((p) => p !== year)
    : [...periods, year].sort((a, b) => a - b);
}

export function changeRange(
  periods: number[],
  start: number,
  end: number,
  remove: boolean,
): number[] {
  const selected = Array.from(
    { length: Math.abs(end - start) + 1 },
    (_, i) => Math.min(start, end) + i,
  );
  return remove
    ? periods.filter((p) => !selected.includes(p))
    : [...new Set([...periods, ...selected])].sort((a, b) => a - b);
}

export function contiguousRanges(periods: number[]): [number, number][] {
  const result: [number, number][] = [];
  for (const year of [...new Set(periods)].sort((a, b) => a - b)) {
    const previous = result.at(-1);
    if (previous && previous[1] === year - 1) previous[1] = year;
    else result.push([year, year]);
  }
  return result;
}

export function formatValue(value: number | null, decimals: number): string {
  if (value === null) return "\u2014";
  if (value !== 0 && Math.abs(value) < 10 ** -decimals)
    return value.toExponential(Math.min(decimals, 4));
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function analyze(item: ReviewItem): Analysis {
  // This is a public teaching example, not the private project's policy catalog.
  if (
    item.kind === "missing_forecast" &&
    item.observations.some(
      (p) => item.flagged.includes(p.year) && p.current === null,
    )
  ) {
    return {
      decision: "raise",
      reason: item.demoReason,
      source: "programmatic rule",
      rule: "Required forecast is missing",
    };
  }
  return {
    decision: item.demoDecision,
    reason: item.demoReason,
    source: "simulated AI",
    rule: "Explanation and contextual assessment",
  };
}

export function contextFor(item: ReviewItem) {
  return {
    synthetic: true,
    indicator: item.code,
    validation: item.validation,
    flaggedPeriods: item.flagged,
    currentAndPrevious: item.observations,
    relatedSeries: item.related,
    deskExplanation: item.deskExplanation,
    correspondence: item.correspondence,
    priorIssue: item.priorIssue,
  };
}

export function restoreSession(
  raw: string | null,
  items: ReviewItem[],
): Session {
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    const saved = parsed as Record<string, unknown>;
    const result: Session = {};
    for (const item of items) {
      const value = saved[item.id];
      if (!value || typeof value !== "object") continue;
      const state = value as ItemState;
      if (
        typeof state.draft !== "string" ||
        typeof state.raised !== "boolean" ||
        typeof state.visited !== "boolean"
      )
        continue;
      if (
        !Array.isArray(state.range) ||
        state.range.length !== 2 ||
        !state.range.every(
          (p) => Number.isInteger(p) && p >= 2014 && p <= 2030,
        ) ||
        state.range[0] > state.range[1]
      )
        continue;
      if (
        !Array.isArray(state.highlights) ||
        !state.highlights.every(
          (p) => Number.isInteger(p) && p >= 2014 && p <= 2030,
        )
      )
        continue;
      // Recompute illustrative analysis instead of trusting stored prose or decisions.
      result[item.id] = {
        ...initialState(item),
        ...state,
        analysis: state.analysis ? analyze(item) : null,
      };
    }
    return result;
  } catch {
    return {};
  }
}
