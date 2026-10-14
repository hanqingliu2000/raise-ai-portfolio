import { useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { contiguousRanges, formatValue } from "../domain/review";
import type { ReviewItem } from "../domain/types";

type Props = {
  item: ReviewItem;
  highlights: number[];
  range: [number, number];
  locked: boolean;
  capture?: boolean;
  onSelect?: (
    start: number,
    end: number,
    remove: boolean,
    click: boolean,
  ) => void;
};

export function SeriesChart({
  item,
  highlights,
  range,
  locked,
  capture = false,
  onSelect,
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [preview, setPreview] = useState<[number, number] | null>(null);
  const drag = useRef<{ year: number; remove: boolean; x: number } | null>(
    null,
  );
  const data = item.observations.filter(
    (p) => p.year >= range[0] && p.year <= range[1],
  );
  const values = data
    .flatMap((p) => [p.current, p.previous, p.published])
    .filter((v): v is number => v !== null);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.12, 1);
  const periodAt = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return Math.max(
      range[0],
      Math.min(
        range[1],
        Math.floor(
          range[0] +
            ((event.clientX - bounds.left) / bounds.width) *
              (range[1] - range[0] + 1),
        ),
      ),
    );
  };
  return (
    <div
      className={`chart-canvas ${capture ? "chart-capture" : ""}`}
      data-testid="chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 16, right: 16, bottom: 8, left: 0 }}
          accessibilityLayer
        >
          <CartesianGrid stroke="#e6e9ee" vertical={false} />
          <XAxis
            type="number"
            dataKey="year"
            domain={[range[0] - 0.5, range[1] + 0.5]}
            ticks={data
              .filter(
                (_, i) => i % Math.max(1, Math.ceil(data.length / 8)) === 0,
              )
              .map((p) => p.year)}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#66717c", fontSize: 12 }}
          />
          <YAxis
            width={54}
            domain={[min - padding, max + padding]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#66717c", fontSize: 12 }}
            tickFormatter={(v: number) => formatValue(v, 0)}
          />
          {contiguousRanges(
            highlights.filter((p) => p >= range[0] && p <= range[1]),
          ).map(([start, end]) => (
            <ReferenceArea
              key={start}
              x1={start - 0.5}
              x2={end + 0.5}
              fill="#efb83c"
              fillOpacity={0.18}
              stroke="none"
            />
          ))}
          {preview && (
            <ReferenceArea
              x1={Math.min(...preview) - 0.5}
              x2={Math.max(...preview) + 0.5}
              fill="#3478cc"
              fillOpacity={0.12}
              stroke="#3478cc"
              strokeDasharray="3 3"
            />
          )}
          <Line
            name="Published"
            dataKey="published"
            type="linear"
            stroke="#a9afb7"
            strokeWidth={1.8}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            name="Previous"
            dataKey="previous"
            type="linear"
            stroke="#1266b5"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            name="Current"
            dataKey="current"
            type="linear"
            stroke="#da6336"
            strokeWidth={2.3}
            dot={{ r: 2.4, fill: "#da6336", strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {!capture && (
        <div
          className={`chart-interaction ${locked ? "locked" : ""}`}
          aria-hidden="true"
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            if (locked || (event.button !== 0 && event.button !== 2)) return;
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = {
              year: periodAt(event),
              remove: event.button === 2,
              x: event.clientX,
            };
          }}
          onPointerMove={(event) => {
            const year = periodAt(event);
            setHover(year);
            if (drag.current && Math.abs(event.clientX - drag.current.x) > 4)
              setPreview([drag.current.year, year]);
          }}
          onPointerUp={(event) => {
            if (!drag.current) return;
            const start = drag.current;
            drag.current = null;
            setPreview(null);
            onSelect?.(
              start.year,
              periodAt(event),
              start.remove,
              Math.abs(event.clientX - start.x) <= 4,
            );
          }}
          onPointerCancel={() => {
            drag.current = null;
            setPreview(null);
          }}
          onPointerLeave={() => {
            if (!drag.current) setHover(null);
          }}
        />
      )}
      {hover !== null && !capture && (
        <div className="chart-readout">
          {hover}{" "}
          <b>
            {formatValue(
              item.observations.find((p) => p.year === hover)?.current ?? null,
              2,
            )}
          </b>
        </div>
      )}
    </div>
  );
}
