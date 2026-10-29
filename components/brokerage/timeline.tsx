import { localizedName } from "@/lib/utils";

type EventRow = {
  id: string;
  createdAt: Date;
  messageAr: string;
  messageEn: string;
  toStatus: string | null;
};

export function BrokerageTimeline({
  events,
  locale,
  title,
}: {
  events: EventRow[];
  locale: string;
  title: string;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-[var(--ro-r-lg)] border border-dashed border-[var(--ro-border)] bg-[var(--ro-sand-50)]/80 px-5 py-8 text-center text-sm text-[var(--ro-ink-500)]">
        {locale === "ar" ? "لا أحداث بعد" : "No events yet"}
      </div>
    );
  }

  return (
    <div className="rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-5">
      <h2 className="mb-4 font-display text-lg font-semibold text-ro-ink">
        {title}
      </h2>
      <ol className="relative space-y-0 ps-1">
        {events.map((e, i) => {
          const last = i === events.length - 1;
          return (
            <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
              {!last ? (
                <span
                  aria-hidden
                  className="absolute start-[0.4rem] top-3 bottom-0 w-px bg-[color-mix(in_srgb,var(--ro-plum-300)_55%,transparent)]"
                />
              ) : null}
              <span
                className={
                  last
                    ? "relative mt-1.5 size-2 shrink-0 rounded-full bg-[var(--ro-plum-700)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--ro-plum-300)_40%,transparent)]"
                    : "relative mt-1.5 size-2 shrink-0 rounded-full bg-[var(--ro-plum-300)]"
                }
              />
              <div className="min-w-0 flex-1">
                <time
                  className="text-[0.7rem] tabular-nums text-[var(--ro-ink-500)]"
                  dateTime={e.createdAt.toISOString()}
                  dir="ltr"
                >
                  {e.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </time>
                <p className="mt-0.5 text-sm text-ro-ink">
                  {localizedName(locale, e.messageAr, e.messageEn) ||
                    e.toStatus}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
