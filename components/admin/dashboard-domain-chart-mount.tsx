"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const DashboardDomainChart = dynamic(
  () =>
    import("@/components/admin/dashboard-domain-chart").then(
      (m) => m.DashboardDomainChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] rounded-[var(--ro-r-lg)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)]" />
    ),
  }
);

export function DashboardDomainChartMount(
  props: ComponentProps<typeof DashboardDomainChart>
) {
  return <DashboardDomainChart {...props} />;
}
