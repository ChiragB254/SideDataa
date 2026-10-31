"use client";

import { useEffect, useRef, useState } from "react";
import {
  HORIZON,
  niceScale,
  rowAt,
  type Estimate,
  type ScenarioId,
} from "@/lib/estimator";
import { chartSummary, type Formatters } from "@/lib/estimator-format";

/*
 * Inline SVG line chart, no chart library. Scenarios differ by dash pattern and weight
 * as well as by tone, and are named by direct labels when there is room and by the
 * legend always. A data table with every value sits next to it.
 */

const HEIGHT = 340;

const series: {
  id: ScenarioId;
  dash?: string;
  width: number;
  cap: "butt" | "round";
  className: string;
}[] = [
  {
    id: "conservative",
    dash: "8 5",
    width: 2.5,
    cap: "butt",
    className: "stroke-ink-soft",
  },
  { id: "expected", width: 3.5, cap: "butt", className: "stroke-accent" },
  { id: "optimistic", dash: "0.1 6", width: 3.5, cap: "round", className: "stroke-ink" },
];

const textClass = "fill-muted text-[12px]";

export function CumulativeChart({ est, f }: { est: Estimate; f: Formatters }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = (w: number) => setWidth(Math.max(260, Math.floor(w)));
    measure(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) measure(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const wide = width >= 560;
  const m = { top: 14, right: wide ? 104 : 12, bottom: 50, left: wide ? 64 : 56 };
  const plotW = width - m.left - m.right;
  const plotH = HEIGHT - m.top - m.bottom;

  let lo = 0;
  let hi = 0;
  for (const s of est.scenarios)
    for (const r of s.rows) {
      lo = Math.min(lo, r.cumulative);
      hi = Math.max(hi, r.cumulative);
    }
  const scale = niceScale(lo, hi, 5);
  const x = (month: number) => m.left + (month / HORIZON) * plotW;
  const y = (v: number) =>
    m.top + plotH - ((v - scale.min) / (scale.max - scale.min || 1)) * plotH;

  const xTicks = wide ? [0, 6, 12, 18, 24, 30, 36] : [0, 12, 24, 36];

  // Direct labels at the right edge, nudged apart so they never overlap.
  const labels = [
    ...est.scenarios.map((s) => ({ text: s.name, y: y(rowAt(s, HORIZON).cumulative) })),
    { text: "Doing nothing", y: y(0) },
  ].sort((a, b) => a.y - b.y);
  labels.forEach((l, i) => {
    const prev = labels[i - 1];
    if (prev && l.y - prev.y < 15) l.y = prev.y + 15;
  });

  const exp = est.expected;

  return (
    <div>
      <p id="chart-summary" className="measure text-ink-soft">
        {chartSummary(est, f)}
      </p>

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]">
        {est.scenarios.map((s) => {
          const st = series.find((q) => q.id === s.id)!;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <svg width="40" height="10" viewBox="0 0 40 10" aria-hidden="true">
                <line
                  x1="3"
                  x2="37"
                  y1="5"
                  y2="5"
                  className={st.className}
                  strokeWidth={st.width}
                  strokeDasharray={st.dash}
                  strokeLinecap={st.cap}
                />
              </svg>
              <span>{s.name}</span>
            </li>
          );
        })}
        <li className="flex items-center gap-2">
          <svg width="40" height="10" viewBox="0 0 40 10" aria-hidden="true">
            <line
              x1="0"
              x2="40"
              y1="5"
              y2="5"
              className="stroke-muted"
              strokeWidth="1.5"
            />
          </svg>
          <span>Doing nothing (zero)</span>
        </li>
        {exp.payback !== null ? (
          <li className="flex items-center gap-2">
            <svg width="40" height="12" viewBox="0 0 40 12" aria-hidden="true">
              <circle
                cx="20"
                cy="6"
                r="4.5"
                className="fill-paper stroke-accent"
                strokeWidth="2"
              />
            </svg>
            <span>As entered payback, month {exp.payback}</span>
          </li>
        ) : null}
      </ul>

      <div ref={box} className="mt-4 w-full" style={{ height: HEIGHT }}>
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-label={`Line chart of cumulative net position over ${HORIZON} months for three scenarios, compared with doing nothing.`}
          aria-describedby="chart-summary"
          className="block max-w-full"
        >
          {scale.ticks.map((t) => (
            <g key={t}>
              <line
                x1={m.left}
                x2={m.left + plotW}
                y1={y(t)}
                y2={y(t)}
                className="stroke-rule"
                strokeWidth="1"
              />
              <text
                x={m.left - 8}
                y={y(t)}
                textAnchor="end"
                dominantBaseline="middle"
                className={textClass}
              >
                {f.moneyShort(t)}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <g key={t}>
              <line
                x1={x(t)}
                x2={x(t)}
                y1={m.top + plotH}
                y2={m.top + plotH + 5}
                className="stroke-muted"
                strokeWidth="1"
              />
              <text
                x={x(t)}
                y={m.top + plotH + 20}
                textAnchor="middle"
                className={textClass}
              >
                {t}
              </text>
            </g>
          ))}
          <text
            x={m.left + plotW / 2}
            y={HEIGHT - 8}
            textAnchor="middle"
            className={textClass}
          >
            Months from start
          </text>

          <line
            x1={m.left}
            x2={m.left + plotW}
            y1={y(0)}
            y2={y(0)}
            className="stroke-muted"
            strokeWidth="1.5"
          />

          {series.map((st) => {
            const s = est.scenarios.find((q) => q.id === st.id)!;
            const d = s.rows
              .map(
                (r, i) =>
                  `${i === 0 ? "M" : "L"}${x(r.month).toFixed(1)} ${y(r.cumulative).toFixed(1)}`,
              )
              .join(" ");
            return (
              <path
                key={st.id}
                d={d}
                fill="none"
                className={st.className}
                strokeWidth={st.width}
                strokeDasharray={st.dash}
                strokeLinecap={st.cap}
                strokeLinejoin="round"
              />
            );
          })}

          {exp.payback !== null ? (
            <circle
              cx={x(exp.payback)}
              cy={y(rowAt(exp, exp.payback).cumulative)}
              r="5.5"
              className="fill-paper stroke-accent"
              strokeWidth="2.5"
            />
          ) : null}

          {wide
            ? labels.map((l) => (
                <text
                  key={l.text}
                  x={m.left + plotW + 8}
                  y={l.y}
                  dominantBaseline="middle"
                  className="fill-ink text-[12px] font-medium"
                >
                  {l.text}
                </text>
              ))
            : null}
        </svg>
      </div>
    </div>
  );
}

export function CumulativeTable({ est, f }: { est: Estimate; f: Formatters }) {
  return (
    <details className="mt-6 border border-rule bg-white">
      <summary className="flex min-h-11 cursor-pointer items-center px-4 font-medium">
        Show the chart data as a table
      </summary>
      <div
        role="region"
        aria-label="Cumulative net by month, table"
        tabIndex={0}
        className="max-h-96 overflow-auto border-t border-rule"
      >
        <table className="w-full border-collapse text-left text-sm">
          <caption className="px-4 py-3 text-left text-muted">
            Cumulative net position at the end of each month, compared with doing nothing.
            Negative numbers mean the project has cost more than it has saved so far.
          </caption>
          <thead>
            <tr className="border-y border-rule bg-wash">
              <th scope="col" className="px-3 py-2 font-medium">
                Month
              </th>
              {est.scenarios.map((s) => (
                <th key={s.id} scope="col" className="px-3 py-2 text-right font-medium">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {est.expected.rows.map((r, i) => (
              <tr key={r.month} className="border-b border-rule">
                <th scope="row" className="px-3 py-1.5 font-normal">
                  {r.month}
                </th>
                {est.scenarios.map((s) => (
                  <td
                    key={s.id}
                    className="px-3 py-1.5 text-right [overflow-wrap:anywhere] tabular-nums"
                  >
                    {f.money(rowAt(s, i).cumulative)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
