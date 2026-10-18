import { Suspense } from "react";
import { ActionQueue } from "@/components/admin/action-queue";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { ConnectionCard } from "@/components/admin/connection-card";
import { KpiTile } from "@/components/admin/kpi-tile";
import { PageHeader } from "@/components/admin/page-header";
import { PortalReveal } from "@/components/portal/reveal";
import { ButtonLink } from "@/components/ui/button";
import { getAdminHomeData } from "@/lib/admin/dashboard";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { getRequestDictionary } from "@/lib/i18n/server";

/** Always refresh KPIs + action queue after trader/admin mutations. */
export const dynamic = "force-dynamic";

function DashboardKpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true">
      <KpiTile label="…" value={0} href="/admin" idleLabel="…" loading />
      <KpiTile label="…" value={0} href="/admin" idleLabel="…" loading />
      <KpiTile label="…" value={0} href="/admin" idleLabel="…" loading />
      <KpiTile label="…" value={0} href="/admin" idleLabel="…" loading />
    </div>
  );
}

async function AdminDashboardBody({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
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
    <div className="space-y-8">
      <PortalReveal stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiTile
            key={kpi.href + kpi.label}
            label={kpi.label}
            value={kpi.value}
            href={kpi.href}
            idleLabel={a.kpiIdle}
          />
        ))}
      </PortalReveal>

      <PortalReveal className="grid gap-6 lg:grid-cols-12">
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
      </PortalReveal>
    </div>
  );
}

/** AD-02 — Dashboard: KPIs, ActionQueue, ConnectionCard, ActivityFeed. */
export default async function AdminDashboardPage() {
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;

  return (
    <section className="space-y-8">
      <PageHeader
        overline="RARE OUD"
        title={a.dashboard}
        action={
          <ButtonLink href="/admin/products/new" variant="primary" size="sm">
            {a.newProduct}
          </ButtonLink>
        }
      />
      <Suspense
        fallback={
          <div className="space-y-8">
            <DashboardKpiSkeleton />
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="ro-portal-card order-1 h-48 border lg:order-2 lg:col-span-5" />
              <div className="ro-portal-card order-2 h-64 border lg:order-1 lg:col-span-7" />
            </div>
          </div>
        }
      >
        <AdminDashboardBody locale={locale} dict={dict} />
      </Suspense>
    </section>
  );
}
