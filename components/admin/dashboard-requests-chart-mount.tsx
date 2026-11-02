"use client";

import dynamic from "next/dynamic";

const DashboardRequestsChart = dynamic(
  () =>
    import("@/components/admin/dashboard-requests-chart").then(
      (m) => m.DashboardRequestsChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[220px] rounded-[var(--ro-r-lg)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)]" />
    ),
  }
);

export function DashboardRequestsChartMount(
  props: React.ComponentProps<typeof DashboardRequestsChart>
) {
  return <DashboardRequestsChart {...props} />;
}
