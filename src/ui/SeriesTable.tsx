import { useLayoutEffect, useRef } from "react";
import { formatValue } from "../domain/review";
import type { ReviewItem } from "../domain/types";

type Props = {
  item: ReviewItem;
  highlights: number[];
  decimals: number;
  range: [number, number];
  onToggle?: (year: number) => void;
  related?: boolean;
  capture?: boolean;
  locked?: boolean;
};

export function SeriesTable({
  item,
  highlights,
  decimals,
  range,
  onToggle,
  related = false,
  capture = false,
  locked = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const previousItem = useRef("");
  const years = item.observations.filter(
    (p) => p.year >= range[0] && p.year <= range[1],
  );
  useLayoutEffect(() => {
    if (!ref.current || capture) return;
    ref.current.scrollLeft =
      previousItem.current !== item.id ? ref.current.scrollWidth : 0;
    previousItem.current = item.id;
  }, [item.id, range[0], range[1], capture]);
  const rows = related
    ? item.related.map((r) => ({
        name: r.code,
        descriptor: r.descriptor,
        values: years.map((p) => r.values[item.observations.indexOf(p)]),
      }))
    : (["current", "previous", "published"] as const).map((name) => ({
        name: name.toUpperCase(),
        descriptor: "",
        values: years.map((p) => p[name]),
      }));
  return (
    <div
      className={`table-scroll ${capture ? "capture-table" : ""}`}
      ref={ref}
      tabIndex={capture ? -1 : 0}
      aria-label={
        related ? "Related indicators table" : "Series comparison table"
      }
    >
      <table
        style={
          {
            "--cell-width": `${Math.max(80, 61 + decimals * 8)}px`,
          } as React.CSSProperties
        }
      >
        <thead>
          <tr>
            <th scope="col">{related ? "Indicator" : "Series"}</th>
            {related && (
              <th scope="col" className="descriptor">
                Descriptor
              </th>
            )}
            {years.map((p) => (
              <th scope="col" key={p.year}>
                {p.year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row" className={`row-name ${row.name.toLowerCase()}`}>
                {row.name}
              </th>
              {related && <td className="descriptor">{row.descriptor}</td>}
              {years.map((p, i) => (
                <td
                  key={p.year}
                  className={highlights.includes(p.year) ? "highlighted" : ""}
                >
                  {capture ? (
                    <span className="cell-value">
                      {formatValue(row.values[i], decimals)}
                    </span>
                  ) : (
                    <button
                      className="cell-value"
                      aria-label={`${row.name}, ${p.year}, ${formatValue(row.values[i], decimals)}`}
                      aria-pressed={highlights.includes(p.year)}
                      aria-disabled={locked}
                      onClick={() => !locked && onToggle?.(p.year)}
                    >
                      {formatValue(row.values[i], decimals)}
                    </button>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
