"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { PluralForms } from "@/lib/i18n/plural";
import { plural } from "@/lib/i18n/plural";
import { cn } from "@/lib/utils";

export type RadChartRange = 7 | 14 | 30;

export function RadOrdersChart({
  title,
  points30,
  defaultRange = 14,
  /** "{n} يوماً" style template for the 7/14/30 segment labels. */
  rangeDaysTemplate,
  captionForms,
  locale,
  tableCaption,
  dateLabels,
}: {
  title: string;
  /** Oldest -> newest, always 30 real points. */
  points30: number[];
  defaultRange?: RadChartRange;
  rangeDaysTemplate: string;
  captionForms: PluralForms;
  locale: Locale;
  tableCaption: string;
  /** oldest -> newest ISO date strings, same length as points30. */
  dateLabels: string[];
}) {
  const segRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [range, onRangeChange] = useState<RadChartRange>(defaultRange);
  const vals = points30.slice(-range);
  const dates = dateLabels.slice(-range);
  const total = vals.reduce((a, b) => a + b, 0);
  const rangeLabel = (n: RadChartRange) => rangeDaysTemplate.replace("{n}", String(n));
  const captionFor = (n: number) => plural(n, locale, captionForms);

  useLayoutEffect(() => {
    const root = segRef.current;
    if (!root) return;
    const on = root.querySelector<HTMLElement>("button[data-on='true']");
    const ind = root.querySelector<HTMLElement>(".rad-ind");
    if (!on || !ind) return;
    ind.style.width = `${on.offsetWidth}px`;
    ind.style.transform = `translateX(${on.offsetLeft}px)`;
  }, [range]);

  const W = 380;
  const H = 176;
  const pl = 8;
  const pr = 30;
  const pt = 10;
  const pb = 24;
  const mx = Math.max(4, Math.ceil(Math.max(...vals, 0) / 2) * 2);
  const iw = W - pl - pr;
  const ih = H - pt - pb;
  const gap = iw / vals.length;
  const bw = Math.max(5, gap * 0.58);
  const max = Math.max(...vals, 0);

  const gridLines = [0, mx / 2, mx];
  const step = range === 7 ? 1 : range === 14 ? 3 : 6;

  return (
    <section className="rad-card rad-chart rad-rise" style={{ "--rad-s": 6 } as React.CSSProperties}>
      <div className="rad-ch" style={{ padding: 0 }}>
        <h2>{title}</h2>
        <div className="rad-seg" ref={segRef} role="tablist" aria-label={title}>
          <span className="rad-ind" aria-hidden />
          {[7, 14, 30].map((n) => (
            <button
              key={n}
              type="button"
              role="tab"
              aria-selected={range === n}
              data-on={range === n ? "true" : undefined}
              className={cn(range === n && "rad-on")}
              onClick={() => onRangeChange(n as RadChartRange)}
            >
              {rangeLabel(n as RadChartRange)}
            </button>
          ))}
        </div>
      </div>
      <div className="rad-ctot">
        <span className="rad-big rad-num">{total}</span>
        <span>{captionFor(total)}</span>
      </div>
      <div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={tableCaption}
          style={{ overflow: "visible", display: "block", width: "100%", height: "auto" }}
        >
          {gridLines.map((g) => {
            const y = pt + ih - (g / mx) * ih;
            return (
              <g key={g}>
                <line className="rad-gl" x1={pl} x2={W - pr} y1={y} y2={y} />
                <text x={W - pr + 8} y={y + 3.5}>
                  {Math.round(g)}
                </text>
              </g>
            );
          })}
          {vals.map((v, i) => {
            const h = Math.max(v ? 3 : 0, (v / mx) * ih);
            const x = pl + i * gap + (gap - bw) / 2;
            const y = pt + ih - h;
            return (
              <rect
                key={i}
                className={cn("rad-bar", v === max && v > 0 && "rad-max", hover === i && "rad-hv")}
                x={x}
                y={y}
                width={bw}
                height={h}
                rx={3}
                style={{ animationDelay: `${i * 28}ms` }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                tabIndex={0}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              />
            );
          })}
          {vals.map((_, i) =>
            i % step === (vals.length - 1) % step ? (
              <text key={`d${i}`} x={pl + i * gap + gap / 2} y={H - 6} textAnchor="middle">
                {new Date(dates[i]!).getDate()}
              </text>
            ) : null
          )}
        </svg>
        {hover !== null ? (
          <div
            className="rad-tip rad-on"
            style={{
              left: Math.min(W - 112, Math.max(8, pl + hover * gap + gap / 2 - 50)),
              top: pt + ih - Math.max(vals[hover] ? 3 : 0, (vals[hover]! / mx) * ih) - 52,
            }}
          >
            <b className="rad-num">{vals[hover]}</b>{" "}
            {captionFor(vals[hover]!).replace(String(vals[hover]), "").trim()}
            <span>
              {new Date(dates[hover]!).toLocaleDateString(locale === "ar" ? "ar" : "en-GB", {
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>
        ) : null}
      </div>
      <table className="sr-only">
        <caption>{tableCaption}</caption>
        <thead>
          <tr>
            <th>{locale === "ar" ? "التاريخ" : "Date"}</th>
            <th>{locale === "ar" ? "العدد" : "Count"}</th>
          </tr>
        </thead>
        <tbody>
          {vals.map((v, i) => (
            <tr key={i}>
              <td>{dates[i]}</td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
