"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { DomainSlice } from "@/components/admin/dashboard-domain-chart";

type Props = {
  slices: DomainSlice[];
  title: string;
  className?: string;
};

/** Isolates recharts from the server dashboard module graph. */
export function DashboardDomainChartMount(props: Props) {
  const [Comp, setComp] = useState<ComponentType<Props> | null>(null);

  useEffect(() => {
    let live = true;
    void import("./dashboard-domain-chart")
      .then((mod) => {
        const next = mod?.DashboardDomainChart;
        if (live && typeof next === "function") setComp(() => next);
      })
      .catch(() => {
        /* chart is optional enhancement */
      });
    return () => {
      live = false;
    };
  }, []);

  if (!Comp) {
    return (
      <div className="rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-4">
        <h2 className="font-display text-lg font-semibold text-ro-ink">
          {props.title}
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm">
          {props.slices.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-sm"
                style={{ background: s.color }}
              />
              {s.label}
              <span className="tabular-nums text-[var(--ro-ink-600)]">
                {s.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return <Comp {...props} />;
}
