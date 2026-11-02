"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";
import { DrawIn, RosetteMark } from "@/components/motion/draw-in";
import { cn } from "@/lib/utils";

export type DomainSlice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export function DashboardDomainChart({
  slices,
  title,
  emptyTitle,
  emptyBody,
  emptyActionHref,
  emptyActionLabel,
  className,
}: {
  slices: DomainSlice[];
  title: string;
  emptyTitle?: string;
  emptyBody?: string;
  emptyActionHref?: string;
  emptyActionLabel?: string;
  className?: string;
}) {
  const sum = slices.reduce((s, x) => s + x.value, 0);
  const total = sum || 1;
  const data = slices.map((s) => ({
    ...s,
    pct: Math.round((s.value / total) * 100),
  }));
  const hasSignal = sum > 0;

  return (
    <div
      className={cn(
        "rounded-[var(--ro-r-lg)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)] p-4 text-[color:var(--ro-text)]",
        className
      )}
    >
      <h2 className="mb-3 font-display text-lg font-semibold text-[color:var(--ro-text)]">
        {title}
      </h2>
      {hasSignal ? (
        <div className="flex flex-wrap items-center gap-4">
          <PieChart width={140} height={140}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={38}
              outerRadius={60}
              strokeWidth={0}
              isAnimationActive
              animationDuration={700}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <ul className="space-y-1.5 text-sm">
            {data.map((d) => (
              <li key={d.key} className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-sm"
                  style={{ background: d.color }}
                  aria-hidden
                />
                <span>{d.label}</span>
                <span className="tabular-nums text-[color:var(--ro-text-muted)]">
                  <bdi dir="ltr">
                    {d.value} · {d.pct}%
                  </bdi>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex h-[140px] flex-col items-center justify-center gap-2.5 text-center">
          <DrawIn className="size-10 text-[var(--ro-plum-400)]">
            <RosetteMark className="size-10" />
          </DrawIn>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{emptyTitle ?? "—"}</p>
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
