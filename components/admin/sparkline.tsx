"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Coord = { x: number; y: number; value: number };

function buildCoords(
  points: readonly number[],
  width: number,
  height: number,
  pad: number
): Coord[] {
  if (points.length === 0) return [];
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = Math.max(max - min, 1);
  const step =
    points.length > 1 ? (width - pad * 2) / (points.length - 1) : width;
  return points.map((value, i) => {
    const x = pad + i * step;
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return { x, y, value };
  });
}

/** Tiny sparkline from real daily counts. Never invents values. Area fill = Stripe/21st KPI. */
export function Sparkline({
  points,
  stroke = "var(--ro-amber-500)",
  className,
  interactive = false,
}: {
  points: readonly number[];
  stroke?: string;
  className?: string;
  /** Hover scrub shows the nearest day value (VISION sound-wave KPI). */
  interactive?: boolean;
}) {
  const width = 120;
  const height = 36;
  const pad = 2;
  const reactId = useId().replace(/:/g, "");
  const [scrub, setScrub] = useState<Coord | null>(null);
  const coords = useMemo(
    () => buildCoords(points, width, height, pad),
    [points]
  );

  const onMove = useCallback(
    (clientX: number, target: SVGSVGElement) => {
      if (!interactive || coords.length === 0) return;
      const rect = target.getBoundingClientRect();
      const x = ((clientX - rect.left) / Math.max(rect.width, 1)) * width;
      let best = coords[0]!;
      let bestDist = Math.abs(best.x - x);
      for (const c of coords) {
        const d = Math.abs(c.x - x);
        if (d < bestDist) {
          best = c;
          bestDist = d;
        }
      }
      setScrub(best);
    },
    [coords, interactive]
  );

  if (points.length === 0 || coords.length === 0) return null;

  const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const first = coords[0]!;
  const last = coords[coords.length - 1]!;
  const area = [
    `${first.x.toFixed(1)},${height - pad}`,
    ...coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`),
    `${last.x.toFixed(1)},${height - pad}`,
  ].join(" ");
  const gradId = `ro-spark-${reactId}`;
  const active = scrub ?? last;

  return (
    <div className={cn("relative", className)}>
      {interactive && scrub ? (
        <span
          className="pointer-events-none absolute -top-4 rounded bg-[color:var(--ro-bg-elevated,var(--ro-bg-raised))] px-1.5 py-0.5 text-[0.62rem] font-semibold tabular-nums text-[color:var(--ro-text)] shadow-sm"
          style={{
            insetInlineEnd: `${Math.max(0, 100 - (active.x / width) * 100)}%`,
          }}
        >
          <bdi dir="ltr">{active.value}</bdi>
        </span>
      ) : null}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        aria-hidden
        className="block"
        preserveAspectRatio="none"
        onPointerMove={
          interactive
            ? (e) => onMove(e.clientX, e.currentTarget)
            : undefined
        }
        onPointerLeave={interactive ? () => setScrub(null) : undefined}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill={`url(#${gradId})`} points={area} />
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={line}
          vectorEffect="non-scaling-stroke"
        />
        {interactive && scrub ? (
          <line
            x1={active.x}
            x2={active.x}
            y1={pad}
            y2={height - pad}
            stroke={stroke}
            strokeOpacity={0.35}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        <circle
          cx={active.x}
          cy={active.y}
          r={interactive && scrub ? 3 : 2.2}
          fill={stroke}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
