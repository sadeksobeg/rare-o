"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkline } from "@/components/admin/sparkline";
import { PressRipple } from "@/components/motion/press-ripple";
import { AnimatedValue } from "@/components/portal/animated-value";
import { Skeleton } from "@/components/ui/skeleton";
import type { KpiSeries } from "@/lib/admin/dashboard";
import { cn } from "@/lib/utils";

export type KpiTone = "amber" | "plum" | "progress" | "success";

const TONE: Record<
  KpiTone,
  { well: string; icon: string; stroke: string }
> = {
  amber: {
    well: "bg-[color-mix(in_srgb,var(--ro-amber-500)_22%,transparent)]",
    icon: "text-[var(--ro-amber-500)]",
    stroke: "var(--ro-amber-500)",
  },
  plum: {
    well: "bg-[color-mix(in_srgb,var(--ro-plum-700)_22%,transparent)]",
    icon: "text-[var(--ro-plum-300)]",
    stroke: "var(--ro-plum-400)",
  },
  progress: {
    well: "bg-[color-mix(in_srgb,var(--ro-progress-700)_22%,transparent)]",
    icon: "text-[var(--ro-progress-700)]",
    stroke: "var(--ro-progress-700)",
  },
  success: {
    well: "bg-[color-mix(in_srgb,var(--ro-success-700)_22%,transparent)]",
    icon: "text-[var(--ro-success-700)]",
    stroke: "var(--ro-success-700)",
  },
};

/** A05 — interactive KPI tile with count-up, 7-day sparkline, and press feedback. */
export function KpiTile({
  label,
  value,
  href,
  idleLabel,
  icon,
  series,
  trendLabel,
  tone = "plum",
  loading = false,
  className,
}: {
  label: string;
  value: number;
  href: string;
  idleLabel: string;
  icon?: ReactNode;
  series?: KpiSeries;
  trendLabel?: string;
  tone?: KpiTone;
  loading?: boolean;
  className?: string;
}) {
  if (loading) {
    return (
      <div
        className={cn("ro-portal-kpi border border-ro-border p-4", className)}
        aria-busy="true"
        aria-label={label}
      >
        <Skeleton className="size-7 rounded-[8px]" />
        <Skeleton className="mt-3 h-3 w-24" />
        <Skeleton className="mt-3 h-8 w-16" />
      </div>
    );
  }

  const palette = TONE[tone];
  const trend =
    value === 0 ? idleLabel : trendLabel;
  const trendUp = series ? series.today > series.yesterday : false;

  return (
    <PressRipple className="flex h-full min-w-0 w-full flex-col">
    <Link
      href={href}
      data-kpi=""
      data-tone={tone}
      className={cn(
        "ro-portal-kpi group flex h-full min-w-0 w-full flex-col border p-3 sm:p-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
        className
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        {icon ? (
          <span
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-[8px] [&>svg]:size-4",
              palette.well,
              palette.icon
            )}
            aria-hidden
          >
            {icon}
          </span>
        ) : (
          <span />
        )}
        {series && series.points.length >= 7 ? (
          <Sparkline points={series.points} stroke={palette.stroke} />
        ) : null}
      </div>
      <p className="text-[12px] font-medium leading-snug text-[color:var(--ro-text-muted)]">
        {label}
      </p>
      <p className="mt-1 font-display text-[1.85rem] font-medium leading-none tabular-nums text-[color:var(--ro-text)] sm:text-[2rem]">
        <AnimatedValue value={value} />
      </p>
      {series &&
      series.points.length < 7 &&
      series.today !== series.yesterday ? (
        <p className="mt-1 text-[11px] text-[color:var(--ro-text-muted)]">
          {series.today > series.yesterday ? "+" : ""}
          {series.today - series.yesterday}
        </p>
      ) : null}
      {trend ? (
        <p
          className={cn(
            "mt-auto pt-2 text-[11px] leading-snug",
            value === 0
              ? "font-bold text-[var(--ro-success-700)]"
              : trendUp
                ? "text-[var(--ro-success-700)]"
                : "text-[color:var(--ro-text-muted)]"
          )}
        >
          {trend}
        </p>
      ) : null}
    </Link>
    </PressRipple>
  );
}
