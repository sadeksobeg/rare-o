import Link from "next/link";
import { Bell } from "lucide-react";
import {
  traderMarkAllNotificationsReadAction,
  traderMarkNotificationReadAction,
} from "@/app/trader-portal-actions";
import { TraderPageHeader } from "@/components/trader/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { formatRelative } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { listTraderNotifications } from "@/lib/trader/notifications";
import { cn, localizedName } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FILTERS = ["all", "deal", "wholesale", "brokerage"] as const;
type Filter = (typeof FILTERS)[number];

function isFilter(v: string | undefined): v is Filter {
  return FILTERS.includes(v as Filter);
}

export default async function TraderNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const session = await requireTraderSession();
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;
  const sp = await searchParams;
  const domainFilter = isFilter(sp.domain) ? sp.domain : "all";
  const items = await listTraderNotifications(session.sub, 50);
  const filtered =
    domainFilter === "all"
      ? items
      : items.filter((n) => n.domain === domainFilter);
  const unread = items.filter((n) => !n.readAt).length;

  const filterLabels: Record<Filter, string> = {
    all: t.notificationsFilterAll,
    deal: t.notificationsFilterDeal,
    wholesale: t.notificationsFilterWholesale,
    brokerage: t.notificationsFilterBrokerage,
  };

  return (
    <section className="space-y-8">
      <TraderPageHeader
        title={t.notificationsTitle}
        description={t.notificationsLead}
        icon={<Bell className="size-5" strokeWidth={2} />}
        action={
          unread > 0 ? (
            <form action={traderMarkAllNotificationsReadAction}>
              <Button type="submit" variant="secondary" size="sm">
                {t.notificationsMarkAll}
              </Button>
            </form>
          ) : null
        }
      />

      <div
        role="tablist"
        aria-label={t.notificationsTitle}
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {FILTERS.map((key) => {
          const href =
            key === "all"
              ? "/trader/notifications"
              : `/trader/notifications?domain=${key}`;
          const active = domainFilter === key;
          return (
            <Link
              key={key}
              href={href}
              role="tab"
              aria-selected={active}
              className={cn(
                "shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                active
                  ? "border-[var(--ro-plum-900)] bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]"
                  : "border-ro-line text-ro-muted hover:bg-ro-sunken"
              )}
            >
              {filterLabels[key]}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={t.notificationsEmpty}
          body={t.notificationsEmptyBody}
          actionHref="/trader"
          actionLabel={t.overview}
        />
      ) : (
        <ul className="ro-portal-card divide-y divide-ro-border overflow-hidden border">
          {filtered.map((n) => {
            const title = localizedName(locale, n.titleAr, n.titleEn);
            const body = localizedName(locale, n.bodyAr, n.bodyEn);
            const unreadRow = !n.readAt;
            return (
              <li key={n.id}>
                <div
                  className={cn(
                    "flex flex-wrap items-start gap-3 px-4 py-3.5",
                    unreadRow &&
                      "ro-s10-flash bg-[color-mix(in_srgb,var(--ro-plum-50)_70%,transparent)]"
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p
                      className={
                        unreadRow
                          ? "font-bold text-ro-ink"
                          : "font-semibold text-ro-ink"
                      }
                    >
                      {title}
                    </p>
                    {body ? (
                      <p className="text-sm text-ro-muted">{body}</p>
                    ) : null}
                    <p className="text-xs text-ro-muted">
                      {formatRelative(n.createdAt, locale)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link
                      href={n.href}
                      className="text-sm font-semibold text-ro-plum hover:underline"
                    >
                      {t.notificationsOpen}
                    </Link>
                    {unreadRow ? (
                      <form action={traderMarkNotificationReadAction}>
                        <input
                          type="hidden"
                          name="notificationId"
                          value={n.id}
                        />
                        <Button type="submit" variant="quiet" size="sm">
                          {t.notificationsMarkRead}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
