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
  detail?: React.ReactNode;
};

/** P19 — vertical hairline axis, node per event, actor chip, relative + absolute time. */
export function Timeline({
  events,
  className,
  label,
}: {
  events: readonly TimelineEvent[];
  className?: string;
  /** Accessible name for the list. */
  label: string;
}) {
  return (
    <ol
      aria-label={label}
      className={cn("relative space-y-0 ps-6", className)}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 start-[0.6875rem] w-px bg-[var(--ro-border-subtle)]"
      />
      {events.map((event) => (
        <li key={event.id} className="relative pb-6 last:pb-0">
          <span
            aria-hidden
            className="absolute start-[-1.3125rem] top-1.5 size-2.5 rounded-full border-2 border-[var(--ro-plum-900)] bg-ro-paper"
          />
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-sm font-medium text-ro-ink">{event.title}</p>
            {event.actor ? (
              <span className="rounded-[var(--ro-r-sm)] bg-ro-sunken px-1.5 py-0.5 text-[0.6875rem] font-medium text-ro-text-2">
                {event.actor}
              </span>
            ) : null}
            <time
              className="text-xs text-ro-muted"
              dateTime={event.absoluteTime}
              title={event.absoluteTime}
            >
              <span>{event.relativeTime}</span>
              <span className="sr-only"> ({event.absoluteTime})</span>
            </time>
          </div>
          {event.detail ? (
            <div className="mt-1.5 text-sm text-ro-text-2">{event.detail}</div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
