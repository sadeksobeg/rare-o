import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Ceremonial list-page hero for admin portal (catalog, ops, brokerage). */
export function PortalHeroStrip({
  eyebrow,
  title,
  subtitle,
  actions,
  stats,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  stats?: { label: string; value: string | number; hint?: string }[];
  className?: string;
}) {
  return (
    <header
      className={cn("ro-portal-hero px-5 py-6 sm:px-7 sm:py-7", className)}
    >
      <div className="relative z-[1] flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          {eyebrow ? (
            <p className="mb-1 text-[0.7rem] font-medium uppercase text-[color:var(--ro-accent-fg,var(--ro-plum-800))]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display text-2xl font-semibold text-[color:var(--ro-text)] sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--ro-text-2)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {stats && stats.length > 0 ? (
        <ul className="relative z-[1] mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <li
              key={s.label}
              className="rounded-[12px] border border-[color:var(--ro-border-subtle)] bg-[color:color-mix(in_srgb,var(--ro-panel)_78%,transparent)] px-3 py-3 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--ro-text)_4%,transparent)] backdrop-blur-[2px]"
            >
              <p className="text-[0.65rem] font-medium text-[color:var(--ro-text-muted)]">
                {s.label}
              </p>
              <p className="mt-1 font-display text-xl font-semibold tabular-nums text-[color:var(--ro-text)]">
                {s.value}
              </p>
              {s.hint ? (
                <p className="mt-0.5 text-[0.65rem] text-[color:var(--ro-text-muted)]">
                  {s.hint}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
