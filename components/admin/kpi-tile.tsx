"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { Sparkline } from "@/components/admin/sparkline";
import { PressRipple } from "@/components/motion/press-ripple";
import { portalPress } from "@/components/motion/presets";
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
    well: "bg-[color-mix(in_srgb,var(--ro-amber-500)_18%,transparent)]",
    icon: "text-[var(--ro-amber-500)]",
    stroke: "var(--ro-amber-500)",
  },
  plum: {
    well: "bg-[color-mix(in_srgb,var(--pilot-plum-700,var(--ro-plum-700))_20%,transparent)]",
    icon: "text-[var(--pilot-plum-300,var(--ro-plum-300))]",
    stroke: "var(--pilot-plum-400,var(--ro-plum-400))",
  },
  progress: {
    well: "bg-[color-mix(in_srgb,var(--ro-progress-700)_18%,transparent)]",
    icon: "text-[var(--ro-progress-700)]",
    stroke: "var(--ro-progress-700)",
  },
  success: {
    well: "bg-[color-mix(in_srgb,var(--ro-success-700)_18%,transparent)]",
    icon: "text-[var(--ro-success-700)]",
    stroke: "var(--ro-success-700)",
  },
};

/**
 * Enterprise KPI card — Stripe anatomy + Linear restraint + VISION press/sheen.
 * One number · one delta · one scrubbable sparkline.
 */
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
  active = false,
  hero = false,
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
  active?: boolean;
  hero?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const lite = Boolean(reduce);

  if (loading) {
    return (
      <div
        className={cn(
          "ro-portal-kpi border border-ro-border",
          hero ? "p-4 sm:p-5" : "p-3.5 sm:p-4",
          className
        )}
        aria-busy="true"
        aria-label={label}
      >
        <Skeleton className="h-3 w-24" />
        <Skeleton className={cn("mt-2", hero ? "h-10 w-20" : "h-8 w-16")} />
        <Skeleton className="mt-3 h-8 w-full" />
      </div>
    );
  }

  const palette = TONE[tone];
  const delta =
    series && Number.isFinite(series.today) && Number.isFinite(series.yesterday)
      ? series.today - series.yesterday
      : null;
  const direction =
    delta === null || delta === 0 ? "flat" : delta > 0 ? "up" : "down";
  const showDelta = delta !== null && delta !== 0;
  const footer =
    value === 0 ? idleLabel : trendLabel ?? (showDelta ? undefined : null);
  const hasSpark = Boolean(series && series.points.length >= 7);

  return (
    <PressRipple className="flex h-full min-w-0 w-full flex-col">
      <m.div
        className="flex h-full min-w-0 w-full flex-col"
        whileTap={lite ? undefined : portalPress.whileTap}
      >
        <Link
          href={href}
          data-kpi=""
          data-tone={tone}
          data-active={active ? "true" : undefined}
          data-hero={hero ? "true" : undefined}
          aria-current={active ? "true" : undefined}
          className={cn(
            "ro-portal-kpi ro-kpi-sheen group relative flex h-full min-w-0 w-full flex-col overflow-hidden border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pilot-focus,var(--ro-focus))]",
            className
          )}
        >
          <div
            className={cn(
              "flex items-start justify-between gap-2",
              hero ? "px-4 pt-4 sm:px-5 sm:pt-4" : "px-3.5 pt-3.5 sm:px-4 sm:pt-4"
            )}
          >
            <div className="min-w-0">
              <p className="truncate text-[0.75rem] font-medium text-[color:var(--pilot-text-muted,var(--ro-text-muted))]">
                {label}
              </p>
              <p
                className={cn(
                  "mt-1.5 font-display font-semibold leading-none tracking-tight tabular-nums text-[color:var(--pilot-text,var(--ro-text))]",
                  hero
                    ? "text-[2.35rem] sm:text-[2.75rem]"
                    : "text-[1.85rem] sm:text-[2.1rem]"
                )}
              >
                <AnimatedValue value={value} />
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {icon ? (
                <span
                  className={cn(
                    "ro-kpi-icon-well inline-flex size-8 items-center justify-center rounded-full [&>svg]:size-[1rem]",
                    palette.well,
                    palette.icon
                  )}
                  aria-hidden
                >
                  {icon}
                </span>
              ) : null}
              {showDelta ? (
                <span
                  className={cn(
                    "ro-kpi-delta inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[0.68rem] font-semibold tabular-nums",
                    direction === "up"
                      ? "bg-[color-mix(in_srgb,var(--ro-success-700)_16%,transparent)] text-[var(--ro-success-700)]"
                      : "bg-[color-mix(in_srgb,var(--pilot-text-muted,var(--ro-text-muted))_14%,transparent)] text-[color:var(--pilot-text-muted,var(--ro-text-muted))]"
                  )}
                  aria-label={direction === "up" ? `+${delta}` : `${delta}`}
                >
                  <ArrowUpRight
                    className={cn(
                      "size-3.5 transition-transform duration-[var(--ro-dur-base,280ms)] motion-reduce:transition-none",
                      direction === "down" && "rotate-90",
                      direction === "flat" && "rotate-45"
                    )}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <bdi dir="ltr">{direction === "up" ? `+${delta}` : delta}</bdi>
                </span>
              ) : null}
            </div>
          </div>

          {hasSpark ? (
            <div
              className={cn(
                "ro-kpi-spark mt-auto",
                hero ? "px-3 pb-2 pt-2 sm:px-4" : "px-2.5 pb-1.5 pt-2 sm:px-3.5"
              )}
            >
              <Sparkline
                points={series!.points}
                stroke={palette.stroke}
                interactive
                className="block h-8 w-full opacity-90 transition-opacity duration-[var(--ro-dur-fast)] group-hover:opacity-100"
              />
            </div>
          ) : (
            <div
              className={cn(
                "mt-auto",
                hero ? "px-4 pb-4 pt-2 sm:px-5" : "px-3.5 pb-3.5 pt-2 sm:px-4"
              )}
            >
              {footer ? (
                <p
                  className={cn(
                    "text-[0.7rem] leading-snug",
                    value === 0
                      ? "font-semibold text-[var(--ro-success-700)]"
                      : "text-[color:var(--pilot-text-muted,var(--ro-text-muted))]"
                  )}
                >
                  {footer}
                </p>
              ) : (
                <span className="block h-3.5" aria-hidden />
              )}
            </div>
          )}

          {hasSpark && footer ? (
            <p
              className={cn(
                "text-[0.68rem] leading-snug",
                hero ? "px-4 pb-3 sm:px-5" : "px-3.5 pb-2.5 sm:px-4",
                value === 0
                  ? "font-semibold text-[var(--ro-success-700)]"
                  : "text-[color:var(--pilot-text-muted,var(--ro-text-muted))]"
              )}
            >
              {footer}
            </p>
          ) : null}
        </Link>
      </m.div>
    </PressRipple>
  );
}
