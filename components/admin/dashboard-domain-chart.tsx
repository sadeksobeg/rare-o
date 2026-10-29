"use client";

import { Cell, Pie, PieChart } from "recharts";
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
  className,
}: {
  slices: DomainSlice[];
  title: string;
  className?: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const data = slices.map((s) => ({
    ...s,
    pct: Math.round((s.value / total) * 100),
  }));

  return (
    <div
      className={cn(
        "rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-4",
        className
      )}
    >
      <h2 className="mb-3 font-display text-lg font-semibold text-ro-ink">
        {title}
      </h2>
      <div className="flex flex-wrap items-center gap-4">
        <PieChart width={140} height={140}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={38}
            outerRadius={60}
            strokeWidth={0}
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
              />
              <span>{d.label}</span>
              <span className="tabular-nums text-[var(--ro-ink-600)]">
                {d.value} · {d.pct}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
