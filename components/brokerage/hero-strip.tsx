import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BrokerageHeroStrip({
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
      className={cn(
        "ro-brokerage-hero px-5 py-6 sm:px-7 sm:py-7",
        className
      )}
    >
      <div className="relative z-[1] flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          {eyebrow ? (
            <p className="mb-1 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--ro-plum-800)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display text-2xl font-semibold text-ro-ink sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--ro-ink-600)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {stats && stats.length > 0 ? (
        <ul className="relative z-[1] mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <li
              key={s.label}
              className="rounded-[var(--ro-r-md)] border border-[color-mix(in_srgb,var(--ro-ink-950)_8%,transparent)] bg-[color-mix(in_srgb,var(--ro-sand-100)_70%,transparent)] px-3 py-3 backdrop-blur-[2px]"
            >
              <p className="text-[0.65rem] font-medium text-[var(--ro-ink-500)]">
                {s.label}
              </p>
              <p className="mt-1 font-display text-xl font-semibold tabular-nums text-ro-ink">
                {s.value}
              </p>
              {s.hint ? (
                <p className="mt-0.5 text-[0.65rem] text-[var(--ro-ink-500)]">
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
