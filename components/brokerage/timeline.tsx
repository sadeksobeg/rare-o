import { brokerageEventMessage } from "@/components/brokerage/labels";
import { formatAdminDate } from "@/lib/i18n/admin-format";
import type { Locale } from "@/lib/i18n/config";

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
  const loc = (locale === "ar" ? "ar" : "en") as Locale;
  if (events.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-[color:var(--rad-bd)] bg-[color:var(--rad-surface2)] px-5 py-8 text-center text-sm text-[color:var(--rad-tx3)]">
        {locale === "ar" ? "لا أحداث بعد" : "No events yet"}
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-[color:var(--rad-bd)] bg-[color:var(--rad-surface2)] p-5">
      <h2
        className="mb-4 text-base font-semibold text-[color:var(--rad-tx)]"
        style={{ fontFamily: "var(--rad-font, inherit)" }}
      >
        {title}
      </h2>
      <ol className="relative space-y-0 ps-1">
        {events.map((e, i) => {
          const last = i === events.length - 1;
          const msg = brokerageEventMessage(
            locale,
            e.messageAr,
            e.messageEn,
            e.toStatus
          );
          return (
            <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
              {!last ? (
                <span
                  aria-hidden
                  className="absolute start-[0.4rem] top-3 bottom-0 w-px bg-[color:var(--rad-bd2)]"
                />
              ) : null}
              <span
                className={
                  last
                    ? "relative mt-1.5 size-2 shrink-0 rounded-full bg-[color:var(--rad-ac)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--rad-ac)_22%,transparent)]"
                    : "relative mt-1.5 size-2 shrink-0 rounded-full bg-[color:var(--rad-bd2)]"
                }
              />
              <div className="min-w-0 flex-1">
                <time
                  className="text-[0.7rem] tabular-nums text-[color:var(--rad-tx3)]"
                  dateTime={e.createdAt.toISOString()}
                >
                  {formatAdminDate(e.createdAt, loc, {
                    withTime: true,
                    forceAbsolute: true,
                  })}
                </time>
                <p className="mt-0.5 text-sm text-[color:var(--rad-tx)]">{msg}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
