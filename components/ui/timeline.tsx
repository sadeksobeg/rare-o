import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TimelineEvent = {
  id: string;
  title: string;
  /** Actor chip text (e.g. إدارة / تاجر). */
  actor?: string;
  /** Relative time shown by default. */
  relativeTime: string;
  /** Absolute time on hover/focus (title + visually hidden detail). */
  absoluteTime: string;
  detail?: ReactNode;
  /** Optional leading icon (domain / action). */
  icon?: ReactNode;
  /** Visual tone for the node well. */
  tone?: "default" | "admin" | "trader" | "retail" | "deal" | "wholesale";
};

const toneWell: Record<NonNullable<TimelineEvent["tone"]>, string> = {
  default:
    "bg-[color-mix(in_srgb,var(--ro-plum-100)_80%,var(--ro-sand-50))] text-[var(--ro-plum-900)] border-[color-mix(in_srgb,var(--ro-plum-900)_14%,transparent)]",
  admin:
    "bg-[color-mix(in_srgb,var(--ro-plum-900)_12%,var(--ro-sand-50))] text-[var(--ro-plum-900)] border-[color-mix(in_srgb,var(--ro-plum-900)_22%,transparent)]",
  trader:
    "bg-[color-mix(in_srgb,var(--ro-amber-100)_80%,var(--ro-sand-50))] text-[var(--ro-amber-800)] border-[color-mix(in_srgb,var(--ro-amber-800)_18%,transparent)]",
  retail:
    "bg-[color-mix(in_srgb,var(--ro-progress-100)_80%,var(--ro-sand-50))] text-[var(--ro-progress-700)] border-[color-mix(in_srgb,var(--ro-progress-700)_16%,transparent)]",
  deal: "bg-[color-mix(in_srgb,var(--ro-plum-100)_80%,var(--ro-sand-50))] text-[var(--ro-plum-900)] border-[color-mix(in_srgb,var(--ro-plum-900)_14%,transparent)]",
  wholesale:
    "bg-[color-mix(in_srgb,var(--ro-success-100)_70%,var(--ro-sand-50))] text-[var(--ro-success-700)] border-[color-mix(in_srgb,var(--ro-success-700)_16%,transparent)]",
};

/** P19 — vertical axis, icon nodes, actor chip, relative + absolute time. */
export function Timeline({
  events,
  className,
  label,
  compact = false,
}: {
  events: readonly TimelineEvent[];
  className?: string;
  /** Accessible name for the list. */
  label: string;
  /** Single-line rows with detail (e.g. فتح) beside the title — home activity. */
  compact?: boolean;
}) {
  return (
    <ol
      aria-label={label}
      className={cn(
        "relative ps-1",
        compact ? "space-y-0.5" : "space-y-1",
        className
      )}
    >
      {events.map((event, index) => (
        <li key={event.id} className="relative">
          {index < events.length - 1 ? (
            <span
              aria-hidden
              className={cn(
                "absolute start-[1.05rem] w-px bg-[color-mix(in_srgb,var(--ro-plum-900)_18%,transparent)]",
                compact
                  ? "top-9 bottom-[-0.2rem]"
                  : "top-11 bottom-[-0.35rem]"
              )}
            />
          ) : null}
          <div
            className={cn(
              "ro-portal-row group relative",
              compact && "!items-center !py-2 !pe-2"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "ro-portal-icon-well relative z-[1] border transition-transform duration-[var(--ro-dur-fast)] group-hover:scale-105",
                compact && "size-8 shrink-0 [&>svg]:size-3.5",
                toneWell[event.tone ?? "default"]
              )}
            >
              {event.icon ?? (
                <span className="size-2 rounded-full bg-current opacity-80" />
              )}
            </span>
            {compact ? (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
                  <p className="truncate text-sm font-bold leading-snug text-[color:var(--rad-tx,var(--ro-ink))]">
                    {event.title}
                  </p>
                  {event.actor ? (
                    <span className="inline-flex items-center rounded-[var(--rad-r-sm,var(--ro-r-sm))] bg-[color:var(--rad-surface3,var(--ro-sunken))] px-1.5 py-0.5 text-[0.6875rem] font-bold text-[color:var(--rad-tx2,var(--ro-text-2))]">
                      {event.actor}
                    </span>
                  ) : null}
                  <time
                    className="text-xs font-semibold text-[color:var(--rad-tx3,var(--ro-muted))]"
                    dateTime={event.absoluteTime}
                    title={event.absoluteTime}
                  >
                    <span>{event.relativeTime}</span>
                    <span className="sr-only"> ({event.absoluteTime})</span>
                  </time>
                </div>
                {event.detail ? (
                  <div className="shrink-0 text-sm font-medium text-[color:var(--rad-tx2,var(--ro-text-2))]">
                    {event.detail}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-[0.9375rem] font-bold leading-snug text-[color:var(--rad-tx,var(--ro-ink))]">
                    {event.title}
                  </p>
                  {event.actor ? (
                    <span className="inline-flex items-center rounded-[var(--rad-r-sm,var(--ro-r-sm))] bg-[color:var(--rad-surface3,var(--ro-sunken))] px-2 py-0.5 text-[0.6875rem] font-bold text-[color:var(--rad-tx2,var(--ro-text-2))]">
                      {event.actor}
                    </span>
                  ) : null}
                  <time
                    className="text-xs font-semibold text-[color:var(--rad-tx3,var(--ro-muted))]"
                    dateTime={event.absoluteTime}
                    title={event.absoluteTime}
                  >
                    <span>{event.relativeTime}</span>
                    <span className="sr-only"> ({event.absoluteTime})</span>
                  </time>
                </div>
                {event.detail ? (
                  <div className="mt-1.5 text-sm font-medium text-[color:var(--rad-tx2,var(--ro-text-2))]">
                    {event.detail}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
