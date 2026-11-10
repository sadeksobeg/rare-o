import Link from "next/link";
import { Bell } from "lucide-react";
import { traderMarkAllNotificationsReadAction } from "@/app/trader-portal-actions";
import { TraderPageHeader } from "@/components/trader/page-header";
import {
  TraderNotificationsList,
  type TraderNotificationRow,
} from "@/components/trader/notifications-list";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { getRequestDictionary } from "@/lib/i18n/server";
import { listTraderNotifications } from "@/lib/trader/notifications";
import { cn } from "@/lib/utils";

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
  const items = await listTraderNotifications(session.sub, 120);
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

  const rows: TraderNotificationRow[] = filtered.map((n) => ({
    id: n.id,
    domain: n.domain,
    titleAr: n.titleAr,
    titleEn: n.titleEn,
    bodyAr: n.bodyAr,
    bodyEn: n.bodyEn,
    href: n.href,
    createdAt: n.createdAt.toISOString(),
    readAt: n.readAt ? n.readAt.toISOString() : null,
  }));

  return (
    <section className="space-y-8">
      <TraderPageHeader
        title={t.notificationsTitle}
        description={t.notificationsLead}
        icon={<Bell className="size-5" strokeWidth={2} />}
        action={
          unread > 0 ? (
            <form action={traderMarkAllNotificationsReadAction}>
              <button type="submit" className="rad-btn rad-gh rad-sm">
                {t.notificationsMarkAll}
              </button>
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
                "min-h-11 shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition-[color,background-color,border-color] duration-[var(--ro-dur-fast)]",
                active
                  ? "border-[color:var(--rad-ac)] bg-[color-mix(in_srgb,var(--rad-ac)_14%,var(--rad-surface2))] text-[color:var(--rad-ac)]"
                  : "border-[color:var(--rad-bd)] text-[color:var(--rad-tx3)] hover:bg-[color:var(--rad-surface3)]"
              )}
            >
              {filterLabels[key]}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={t.notificationsEmpty}
          body={t.notificationsEmptyBody}
          actionHref="/trader"
          actionLabel={t.overview}
        />
      ) : (
        <TraderNotificationsList
          items={rows}
          locale={locale}
          labels={{
            open: t.notificationsOpen,
            markRead: t.notificationsMarkRead,
            showMore: t.notificationsShowMore,
            groupedCount: t.notificationsGroupedCount,
          }}
        />
      )}
    </section>
  );
}
