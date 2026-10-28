import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Handshake, MessageSquare, Package, ShoppingBag } from "lucide-react";
import { ActionQueue } from "@/components/admin/action-queue";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { DashboardAside } from "@/components/admin/dashboard-aside";
import { KpiTile, type KpiTone } from "@/components/admin/kpi-tile";
import { ButtonLink } from "@/components/ui/button";
import { getAdminHomeData, type KpiSeries } from "@/lib/admin/dashboard";
import { formatDate } from "@/lib/i18n/format";
import { greetingHeadline } from "@/lib/i18n/greeting";
import { getRequestDictionary } from "@/lib/i18n/server";
import { fmt } from "@/lib/ui/trader-labels";

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
  const waiting =
    data.kpis.retailAwaitingAdmin +
    data.kpis.dealsAwaitingAdmin +
    data.kpis.wholesaleAwaitingAdmin;
  const today = formatDate(new Date(), locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const description =
    waiting === 0
      ? fmt(a.waitingTodayZero, { date: today })
      : fmt(a.waitingToday, { n: waiting, date: today });

  const kpis: {
    label: string;
    value: number;
    href: string;
    series: KpiSeries;
    tone: KpiTone;
    icon: ReactNode;
  }[] = [
    {
      label: a.kpiRetail,
      value: data.kpis.retailAwaitingAdmin,
      href: "/admin/requests",
      series: data.series.retail,
      tone: "amber",
      icon: <ShoppingBag className="size-4" strokeWidth={1.5} aria-hidden />,
    },
    {
      label: a.kpiDeals,
      value: data.kpis.dealsAwaitingAdmin,
      href: "/admin/deals",
      series: data.series.deals,
      tone: "plum",
      icon: <Handshake className="size-4" strokeWidth={1.5} aria-hidden />,
    },
    {
      label: a.kpiWholesale,
      value: data.kpis.wholesaleAwaitingAdmin,
      href: "/admin/wholesale",
      series: data.series.wholesale,
      tone: "progress",
      icon: <Package className="size-4" strokeWidth={1.5} aria-hidden />,
    },
    {
      label: a.kpiUnread,
      value: data.kpis.unreadConversations,
      href: "/admin/inbox",
      series: data.series.inbox,
      tone: "success",
      icon: <MessageSquare className="size-4" strokeWidth={1.5} aria-hidden />,
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
      <main id="main-content" className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[1.7rem] font-medium tracking-tight">
              {greetingHeadline(null, dict.common)}
            </h1>
            <p className="mt-1 text-sm text-[var(--ro-ink-600)]">{description}</p>
          </div>
          <ButtonLink href="/admin/products/new" variant="primary" size="sm">
            {a.newProduct}
          </ButtonLink>
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiTile
              key={kpi.href + kpi.label}
              label={kpi.label}
              value={kpi.value}
              href={kpi.href}
              idleLabel={a.kpiIdle}
              icon={kpi.icon}
              series={kpi.series}
              tone={kpi.tone}
            />
          ))}
        </div>

        <div className="grid gap-2.5 lg:grid-cols-12">
          <ActionQueue
            rows={data.actionQueue}
            counts={{
              retail: data.kpis.retailAwaitingAdmin,
              deal: data.kpis.dealsAwaitingAdmin,
              wholesale: data.kpis.wholesaleAwaitingAdmin,
            }}
            dict={dict}
            locale={locale}
            className="order-2 lg:order-1 lg:col-span-7"
          />
          <DashboardAside
            health={data.health}
            lastWhatsAppAt={data.lastWhatsAppAt}
            catalogHealth={data.catalogHealth}
            pipeline={data.pipeline}
            dict={dict}
            locale={locale}
            className="order-1 lg:order-2 lg:col-span-5"
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
