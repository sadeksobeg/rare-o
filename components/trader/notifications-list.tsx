"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { traderMarkNotificationReadAction } from "@/app/trader-portal-actions";
import { formatDate, formatDayKey } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { cn, localizedName } from "@/lib/utils";

export type TraderNotificationRow = {
  id: string;
  domain: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  href: string;
  createdAt: string | Date;
  readAt: string | Date | null;
};

type Labels = {
  open: string;
  markRead: string;
  showMore: string;
  groupedCount: string;
};

const INITIAL = 20;

function dayHeading(dayKey: string, locale: Locale): string {
  const today = formatDayKey(new Date());
  if (dayKey === today) return locale === "ar" ? "اليوم" : "Today";
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (dayKey === formatDayKey(y)) return locale === "ar" ? "أمس" : "Yesterday";
  const [yy, mm, dd] = dayKey.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    numberingSystem: "latn",
  }).format(new Date(Date.UTC(yy, mm - 1, dd, 12)));
}

/** Collapse identical href+title into one row; keep newest + unread union. */
function collapse(items: TraderNotificationRow[]) {
  const map = new Map<
    string,
    TraderNotificationRow & { count: number; ids: string[] }
  >();
  for (const n of items) {
    const key = `${n.href}::${n.titleAr}::${n.titleEn}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...n, count: 1, ids: [n.id] });
      continue;
    }
    prev.count += 1;
    prev.ids.push(n.id);
    if (!n.readAt) prev.readAt = null;
  }
  return [...map.values()];
}

export function TraderNotificationsList({
  items,
  locale,
  labels,
}: {
  items: TraderNotificationRow[];
  locale: Locale;
  labels: Labels;
}) {
  const [expanded, setExpanded] = useState(false);

  const groups = useMemo(() => {
    const collapsed = collapse(items);
    const byDay = new Map<string, typeof collapsed>();
    for (const n of collapsed) {
      const key = formatDayKey(new Date(n.createdAt));
      const list = byDay.get(key) ?? [];
      list.push(n);
      byDay.set(key, list);
    }
    return [...byDay.entries()].map(([day, rows]) => ({ day, rows }));
  }, [items]);

  const flat = useMemo(
    () => groups.flatMap((g) => g.rows.map((r) => ({ day: g.day, row: r }))),
    [groups]
  );
  const visible = expanded ? flat : flat.slice(0, INITIAL);
  const hidden = Math.max(0, flat.length - INITIAL);

  const visibleGroups = useMemo(() => {
    const map = new Map<string, (typeof groups)[0]["rows"]>();
    for (const { day, row } of visible) {
      const list = map.get(day) ?? [];
      list.push(row);
      map.set(day, list);
    }
    return [...map.entries()].map(([day, rows]) => ({ day, rows }));
  }, [visible]);

  return (
    <div className="space-y-5">
      {visibleGroups.map((g) => (
        <section key={g.day} className="space-y-2">
          <h2 className="px-1 text-xs font-semibold tracking-wide text-[color:var(--rad-tx3)]">
            {dayHeading(g.day, locale)}
          </h2>
          <ul className="rad-card divide-y divide-[color:var(--rad-bd)] overflow-hidden">
            {g.rows.map((n) => {
              const title = localizedName(locale, n.titleAr, n.titleEn);
              const body = localizedName(locale, n.bodyAr, n.bodyEn);
              const unreadRow = !n.readAt;
              const timeLabel = formatDate(new Date(n.createdAt), locale, {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
              return (
                <li key={n.ids[0] ?? n.id}>
                  <div
                    className={cn(
                      "flex min-h-11 items-stretch gap-2 transition-[background-color] duration-[var(--ro-dur-fast)]",
                      unreadRow &&
                        "ro-row-flash bg-[color-mix(in_srgb,var(--rad-ac)_10%,transparent)]"
                    )}
                  >
                    <Link
                      href={n.href}
                      className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3.5 text-start hover:bg-[color:var(--rad-surface2)]"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <p
                          className={cn(
                            "flex flex-wrap items-center gap-2",
                            unreadRow
                              ? "font-bold text-[color:var(--rad-tx)]"
                              : "font-semibold text-[color:var(--rad-tx)]"
                          )}
                        >
                          <span className="min-w-0 break-words">{title}</span>
                          {n.count > 1 ? (
                            <span className="inline-flex shrink-0 items-center rounded-full border border-[color:var(--rad-bd2)] bg-[color:var(--rad-surface2)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[color:var(--rad-tx2)]">
                              · {labels.groupedCount.replace("{n}", String(n.count))}
                            </span>
                          ) : null}
                        </p>
                        {body ? (
                          <p className="text-sm text-[color:var(--rad-tx3)]">
                            {body}
                          </p>
                        ) : null}
                        <p className="text-xs tabular-nums text-[color:var(--rad-tx3)]">
                          <bdi dir="ltr">{timeLabel}</bdi>
                        </p>
                      </div>
                      <ChevronLeft
                        className="mt-1 size-4 shrink-0 text-[color:var(--rad-tx3)] rtl:-scale-x-100"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <span className="sr-only">{labels.open}</span>
                    </Link>
                    {unreadRow ? (
                      <form
                        action={traderMarkNotificationReadAction}
                        className="flex items-center pe-3"
                      >
                        <input
                          type="hidden"
                          name="notificationId"
                          value={n.id}
                        />
                        <button
                          type="submit"
                          className="rad-btn rad-gh rad-sm"
                        >
                          {labels.markRead}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {!expanded && hidden > 0 ? (
        <button
          type="button"
          className="rad-btn rad-gh w-full min-h-11"
          onClick={() => setExpanded(true)}
        >
          {labels.showMore}
          <span className="tabular-nums text-[color:var(--rad-tx3)]">
            ({hidden})
          </span>
        </button>
      ) : null}
    </div>
  );
}
