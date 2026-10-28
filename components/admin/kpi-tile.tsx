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
    well: "bg-[var(--ro-amber-100)]",
    icon: "text-[var(--ro-amber-800)]",
    stroke: "var(--ro-amber-500)",
  },
  plum: {
    well: "bg-[var(--ro-plum-100)]",
    icon: "text-[var(--ro-plum-900)]",
    stroke: "var(--ro-plum-900)",
  },
  progress: {
    well: "bg-[var(--ro-progress-100)]",
    icon: "text-[var(--ro-progress-700)]",
    stroke: "var(--ro-progress-700)",
  },
  success: {
    well: "bg-[var(--ro-success-100)]",
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
  const trendDown = series ? series.today < series.yesterday : false;

  return (
    <PressRipple className="h-full">
    <Link
      href={href}
      data-kpi=""
      data-tone={tone}
      className={cn(
        "ro-portal-kpi group block border p-3 sm:p-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
        className
      )}
    >
      {icon ? (
        <span
          className={cn(
            "mb-1 inline-flex size-7 items-center justify-center rounded-[8px] [&>svg]:size-4",
            palette.well,
            palette.icon
          )}
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      <p className="text-[12px] font-medium leading-snug text-[var(--ro-ink-600)]">
        {label}
      </p>
      <p className="mt-0.5 font-display text-[1.65rem] font-medium leading-none tabular-nums text-ro-ink sm:text-[1.75rem]">
        <AnimatedValue value={value} />
      </p>
      {series ? <Sparkline points={series.points} stroke={palette.stroke} /> : null}
      {trend ? (
        <p
          className={cn(
            "mt-0.5 text-[11px] leading-snug",
            value === 0
              ? "font-bold text-[var(--ro-success-700)]"
              : trendUp
                ? "text-[var(--ro-success-700)]"
                : trendDown
                  ? "text-[var(--ro-ink-600)]"
                  : "text-[var(--ro-ink-600)]"
          )}
        >
          {trend}
        </p>
      ) : null}
    </Link>
    </PressRipple>
  );
}
