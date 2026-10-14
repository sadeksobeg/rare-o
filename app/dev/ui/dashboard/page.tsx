import { notFound } from "next/navigation";
import { ActionQueue } from "@/components/admin/action-queue";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { ConnectionCard } from "@/components/admin/connection-card";
import { KpiTile } from "@/components/admin/kpi-tile";
import { ButtonLink } from "@/components/ui/button";
import { getAdminHomeData } from "@/lib/admin/dashboard";
import { getRequestDictionary } from "@/lib/i18n/server";

export const metadata = {
  title: "RARE OUD — AD-02 dashboard preview (dev)",
  robots: { index: false, follow: false },
};

/**
 * Dev-only mirror of AD-02 for automated screenshots without admin session.
 * Production returns 404.
 */
export default async function DevDashboardPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

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
    <div className="min-h-screen bg-ro-canvas text-ro-ink">
      <header className="border-b border-ro-border px-4 py-4 sm:px-6">
        <p className="ro-type-overline text-ro-plum">DEV ONLY · /dev/ui/dashboard</p>
        <p className="mt-1 text-sm text-ro-muted">
          Locale: <bdi>{locale}</bdi> · AD-02 layout preview for Slice C shots
        </p>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            {a.dashboard}
          </h1>
          <ButtonLink href="/admin/products/new" variant="primary" size="sm">
            {a.newProduct}
          </ButtonLink>
        </div>

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
      </main>
    </div>
  );
}
