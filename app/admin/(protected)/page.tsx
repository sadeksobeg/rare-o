import { ActionQueue } from "@/components/admin/action-queue";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { ConnectionCard } from "@/components/admin/connection-card";
import { KpiTile } from "@/components/admin/kpi-tile";
import { ButtonLink } from "@/components/ui/button";
import { getAdminHomeData } from "@/lib/admin/dashboard";
import { getRequestDictionary } from "@/lib/i18n/server";

/** AD-02 — Dashboard: KPIs, ActionQueue, ConnectionCard, ActivityFeed. */
export default async function AdminDashboardPage() {
  const { locale, dict } = await getRequestDictionary();
  const data = await getAdminHomeData();
  const a = dict.admin;

  const kpis = [
    {
      label: a.kpiRetail,
      value: data.kpis.retailAwaitingAdmin,
      href: "/admin/requests",
    },
    {
      label: a.kpiDeals,
      value: data.kpis.dealsAwaitingAdmin,
      href: "/admin/deals",
    },
    {
      label: a.kpiWholesale,
      value: data.kpis.wholesaleAwaitingAdmin,
      href: "/admin/wholesale",
    },
    {
      label: a.kpiUnread,
      value: data.kpis.unreadConversations,
      href: "/admin/inbox",
    },
  ];

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            {a.dashboard}
          </h1>
        </div>
        <ButtonLink href="/admin/products/new" variant="primary" size="sm">
          {a.newProduct}
        </ButtonLink>
      </div>

      {/* KPIs: 2×2 mobile, 4-up desktop */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiTile
            key={kpi.href + kpi.label}
            label={kpi.label}
            value={kpi.value}
            href={kpi.href}
            idleLabel={a.kpiIdle}
          />
        ))}
      </div>

      {/*
        Mobile order (390): connection → queue → feed
        Desktop: queue (1–7) | connection (8–12), then feed full width
      */}
      <div className="grid gap-6 lg:grid-cols-12">
        <ConnectionCard
          health={data.health}
          dict={dict}
          locale={locale}
          className="order-1 lg:order-2 lg:col-span-5"
        />
        <ActionQueue
          rows={data.actionQueue}
          dict={dict}
          locale={locale}
          className="order-2 lg:order-1 lg:col-span-7"
        />
        <ActivityFeed
          items={data.activityFeed}
          dict={dict}
          locale={locale}
          className="order-3 lg:col-span-12"
        />
      </div>
    </section>
  );
}
