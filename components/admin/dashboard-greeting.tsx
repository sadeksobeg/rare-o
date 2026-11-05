"use client";

import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Admin home greeting bar — cinematic but damped (VISION ≤300ms UI enter).
 * Ambient loops stop under prefers-reduced-motion.
 */
export function DashboardGreeting({
  greeting,
  description,
  statusLabel,
  statusLive,
  className,
}: {
  greeting: string;
  description: string;
  statusLabel: string;
  statusLive: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const lite = Boolean(reduce);

  return (
    <section
      className={cn("ro-admin-greeting", className)}
      data-greeting-motion={lite ? "lite" : "full"}
      aria-labelledby="admin-greeting-title"
    >
      {/* Ambient layers — transform/opacity only */}
      <div className="ro-admin-greeting-fx" aria-hidden>
        <span className="ro-admin-greeting-orb ro-admin-greeting-orb--a" />
        <span className="ro-admin-greeting-orb ro-admin-greeting-orb--b" />
        <span className="ro-admin-greeting-orb ro-admin-greeting-orb--c" />
        <span className="ro-admin-greeting-sheen" />
        <svg
          className="ro-admin-greeting-rings"
          viewBox="0 0 200 200"
          preserveAspectRatio="xMidYMid slice"
        >
          <circle cx="100" cy="100" r="38" className="ro-admin-greeting-ring" />
          <circle cx="100" cy="100" r="58" className="ro-admin-greeting-ring ro-admin-greeting-ring--2" />
          <circle cx="100" cy="100" r="78" className="ro-admin-greeting-ring ro-admin-greeting-ring--3" />
        </svg>
      </div>

      <div className="ro-admin-home-pad relative z-[1] flex flex-wrap items-end justify-between gap-3 py-3.5 sm:py-4">
        <div className="min-w-0 max-w-3xl space-y-1.5">
          <m.p
            className="flex items-center gap-2 text-xs font-medium text-[color-mix(in_srgb,var(--ro-sand-100)_72%,transparent)] sm:text-sm"
            initial={lite ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: lite ? 0.14 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className={cn(
                "relative inline-flex size-2.5 rounded-full",
                statusLive
                  ? "bg-[var(--ro-success-700)]"
                  : "bg-[color-mix(in_srgb,var(--ro-amber-500)_85%,var(--ro-sand-100))]"
              )}
            >
              {!lite ? (
                <span
                  className={cn(
                    "absolute inset-0 rounded-full opacity-70",
                    statusLive
                      ? "animate-[ro-greeting-pulse_2.4s_ease-out_infinite] bg-[var(--ro-success-700)]"
                      : "animate-[ro-greeting-pulse_2.8s_ease-out_infinite] bg-[var(--ro-amber-500)]"
                  )}
                />
              ) : null}
            </span>
            {statusLabel}
          </m.p>

          <m.h1
            id="admin-greeting-title"
            className="font-display text-[1.55rem] font-semibold tracking-tight text-[var(--ro-sand-50)] sm:text-[1.9rem]"
            initial={lite ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: lite ? 0.14 : 0.3,
              delay: lite ? 0 : 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {greeting}
          </m.h1>

          <m.p
            className="max-w-xl text-sm leading-relaxed text-[color-mix(in_srgb,var(--ro-sand-100)_70%,transparent)] sm:text-[0.95rem]"
            initial={lite ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: lite ? 0.14 : 0.28,
              delay: lite ? 0 : 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {description}
          </m.p>
        </div>

        {/* Resonance mark — brand breath */}
        <m.div
          className="pointer-events-none hidden shrink-0 sm:block"
          aria-hidden
          initial={lite ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: lite ? 0.14 : 0.3, delay: lite ? 0 : 0.08 }}
        >
          <div className="ro-admin-greeting-mark">
            <span className="ro-admin-greeting-mark-core" />
            <span className="ro-admin-greeting-mark-ring" />
            <span className="ro-admin-greeting-mark-ring ro-admin-greeting-mark-ring--delay" />
          </div>
        </m.div>
      </div>

      <svg
        className="ro-admin-greeting-wave pointer-events-none absolute inset-x-0 bottom-0 h-8 w-full"
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          className="ro-admin-greeting-wave-path"
          d="M0 22 C 150 6, 300 34, 450 18 S 750 4, 900 22 S 1100 36, 1200 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          className="ro-admin-greeting-wave-path ro-admin-greeting-wave-path--soft"
          d="M0 28 C 180 14, 360 32, 540 20 S 860 10, 1200 26"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    </section>
  );
}
