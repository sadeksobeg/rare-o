import { Suspense } from "react";
import { Bell } from "lucide-react";
import { traderMarkAllNotificationsReadAction } from "@/app/trader-portal-actions";
import { DealsFilterTabs } from "@/components/trader/deals-filter-tabs";
import { TraderPageHeader } from "@/components/trader/page-header";
import {
  TraderNotificationsList,
  type TraderNotificationRow,
} from "@/components/trader/notifications-list";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { getRequestDictionary } from "@/lib/i18n/server";
import { listTraderNotifications } from "@/lib/trader/notifications";

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

  const counts = {
    all: items.length,
    deal: items.filter((n) => n.domain === "deal").length,
    wholesale: items.filter((n) => n.domain === "wholesale").length,
    brokerage: items.filter((n) => n.domain === "brokerage").length,
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
    <section className="space-y-8 pb-[calc(68px+env(safe-area-inset-bottom,0px)+24px)] min-[901px]:pb-0">
      <TraderPageHeader
        title={t.notificationsTitle}
        description={t.notificationsLead}
        icon={<Bell className="size-5" strokeWidth={1.5} />}
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

      <Suspense fallback={null}>
        <DealsFilterTabs
          label={t.notificationsTitle}
          param="domain"
          tabs={[
            {
              id: "all",
              label: t.notificationsFilterAll,
              count: counts.all,
            },
            {
              id: "deal",
              label: t.notificationsFilterDeal,
              count: counts.deal,
            },
            {
              id: "wholesale",
              label: t.notificationsFilterWholesale,
              count: counts.wholesale,
            },
            {
              id: "brokerage",
              label: t.notificationsFilterBrokerage,
              count: counts.brokerage,
            },
          ]}
        />
      </Suspense>

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
