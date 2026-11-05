"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { DrawIn, RosetteMark } from "@/components/motion/draw-in";
import { cn } from "@/lib/utils";

export function DashboardRequestsChart({
  title,
  totalLabel,
  points,
  total,
  emptyTitle,
  emptyBody,
  emptyActionHref,
  emptyActionLabel,
  highlightDomain,
  className,
}: {
  title: string;
  totalLabel: string;
  points: number[];
  total: number;
  emptyTitle?: string;
  emptyBody?: string;
  emptyActionHref?: string;
  emptyActionLabel?: string;
  /** When a path KPI is active, emphasize the chart surface. */
  highlightDomain?: string | null;
  className?: string;
}) {
  const data = points.map((requests, i) => ({
    day: i + 1,
    requests,
  }));
  const hasSignal = points.some((n) => n > 0);
  const accented = Boolean(highlightDomain && highlightDomain !== "all");

  return (
    <div
      className={cn(
        "rounded-[var(--ro-r-lg)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)] p-4 text-[color:var(--ro-text)] transition-[border-color,background-color] duration-[var(--ro-dur-fast)]",
        accented &&
          "border-[color-mix(in_srgb,var(--ro-plum-700)_42%,var(--ro-border-subtle))] bg-[color-mix(in_srgb,var(--ro-plum-700)_6%,var(--ro-bg-raised))]",
        className
      )}
      data-chart-sync={highlightDomain ?? "all"}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-[color:var(--ro-text)]">
          {title}
        </h2>
        <span className="text-xs tabular-nums text-[color:var(--ro-text-muted)]">
          {totalLabel} <bdi dir="ltr">{total}</bdi>
        </span>
      </div>
      {hasSignal ? (
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="roFillRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--ro-plum-300)"
                    stopOpacity={0.55}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--ro-plum-300)"
                    stopOpacity={0.04}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--ro-border)"
                strokeOpacity={0.55}
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--ro-text-muted)" }}
                hide
              />
              <Tooltip
                cursor={{
                  stroke: "var(--ro-plum-400)",
                  strokeOpacity: 0.35,
                  strokeWidth: 1,
                }}
                contentStyle={{
                  background: "var(--ro-bg-elevated, var(--ro-bg-raised))",
                  border:
                    "1px solid color-mix(in srgb, var(--ro-border-subtle) 90%, transparent)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--ro-text)",
                }}
                labelFormatter={(d) => `D${d}`}
                formatter={(value) => [
                  <bdi key="v" dir="ltr">
                    {String(value)}
                  </bdi>,
                  totalLabel,
                ]}
              />
              <Area
                dataKey="requests"
                type="monotone"
                stroke="var(--ro-plum-400)"
                fill="url(#roFillRequests)"
                strokeWidth={2}
                isAnimationActive
                animationDuration={700}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-[140px] flex-col items-center justify-center gap-2.5 text-center">
          <DrawIn className="size-10 text-[var(--ro-plum-400)]">
            <RosetteMark className="size-10" />
          </DrawIn>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[color:var(--ro-text)]">
              {emptyTitle ?? "—"}
            </p>
            {emptyBody ? (
              <p className="max-w-[16rem] text-xs text-[color:var(--ro-text-muted)]">
                {emptyBody}
              </p>
            ) : null}
          </div>
          {emptyActionHref && emptyActionLabel ? (
            <Link
              href={emptyActionHref}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--ro-r-sm)] border border-[color:var(--ro-border)] px-3 text-sm font-semibold text-[color:var(--ro-text)] transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" strokeWidth={1.5} aria-hidden />
              {emptyActionLabel}
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
