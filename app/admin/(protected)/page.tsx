import { Suspense, type ReactNode } from "react";
import {
  Boxes,
  Handshake,
  MessageSquare,
  Package,
  Plus,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { ActionQueue } from "@/components/admin/action-queue";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { DashboardAside } from "@/components/admin/dashboard-aside";
import { KpiTile, type KpiTone } from "@/components/admin/kpi-tile";
import { ManageHub } from "@/components/admin/manage-hub";
import { PageHeader } from "@/components/admin/page-header";
import { Stagger } from "@/components/motion/reveal";
import { HomeAmbient } from "@/components/portal/home-ambient";
import { PortalReveal } from "@/components/portal/reveal";
import { ButtonLink } from "@/components/ui/button";
import { getAdminHomeData, type KpiSeries } from "@/lib/admin/dashboard";
import { getAdminSessionChrome } from "@/lib/auth/admin-session";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/format";
import { greetingHeadline } from "@/lib/i18n/greeting";
import { getRequestDictionary } from "@/lib/i18n/server";
import { fmt } from "@/lib/ui/trader-labels";

/** Always refresh KPIs + action queue after trader/admin mutations. */
export const dynamic = "force-dynamic";

function DashboardKpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4" aria-busy="true">
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
  greeting,
}: {
  locale: Locale;
  dict: Dictionary;
  greeting: string;
}) {
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
    icon: ReactNode;
    series: KpiSeries;
    tone: KpiTone;
  }[] = [
    {
      label: a.kpiRetail,
      value: data.kpis.retailAwaitingAdmin,
      href: "/admin/requests?tab=waiting",
      icon: <ShoppingBag className="size-4" strokeWidth={1.5} aria-hidden />,
      series: data.series.retail,
      tone: "amber",
    },
    {
      label: a.kpiDeals,
      value: data.kpis.dealsAwaitingAdmin,
      href: "/admin/deals?tab=waiting",
      icon: <Handshake className="size-4" strokeWidth={1.5} aria-hidden />,
      series: data.series.deals,
      tone: "plum",
    },
    {
      label: a.kpiWholesale,
      value: data.kpis.wholesaleAwaitingAdmin,
      href: "/admin/wholesale?tab=waiting",
      icon: <Package className="size-4" strokeWidth={1.5} aria-hidden />,
      series: data.series.wholesale,
      tone: "progress",
    },
    {
      label: a.kpiUnread,
      value: data.kpis.unreadConversations,
      href: "/admin/inbox?tab=unread",
      icon: <MessageSquare className="size-4" strokeWidth={1.5} aria-hidden />,
      series: data.series.inbox,
      tone: "success",
    },
  ];

  return (
    <div className="relative space-y-6">
      <HomeAmbient />
      <PageHeader
        title={greeting}
        description={description}
        action={
          <ButtonLink href="/admin/products/new" variant="primary" size="sm">
            <Plus className="size-3.5" strokeWidth={1.5} aria-hidden />
            {a.newProduct}
          </ButtonLink>
        }
      />

      <Stagger
        stepMs={50}
        className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"
      >
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
            className="h-full"
          />
        ))}
      </Stagger>

      <PortalReveal>
        <ManageHub
          title={a.manageHub}
          items={[
            {
              href: "/admin/products",
              label: a.publishedCount,
              value: data.manageHub.publishedProducts,
              icon: <Boxes strokeWidth={1.5} />,
            },
            {
              href: "/admin/traders",
              label: a.traders,
              value: data.manageHub.traders,
              icon: <Store strokeWidth={1.5} />,
            },
            {
              href: "/admin/customers",
              label: a.customers,
              value: data.manageHub.customers,
              icon: <Users strokeWidth={1.5} />,
            },
            {
              href: "/admin/inbox",
              label: a.inbox,
              value: data.manageHub.unreadConversations,
              icon: <MessageSquare strokeWidth={1.5} />,
            },
          ]}
        />
      </PortalReveal>

      <PortalReveal className="grid items-start gap-2.5 lg:grid-cols-12">
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
      </PortalReveal>
    </div>
  );
}

/** AD-02 — Dashboard: greeting, KPIs, ActionQueue, health aside, ActivityFeed. */
export default async function AdminDashboardPage() {
  const { locale, dict } = await getRequestDictionary();
  const session = await getAdminSessionChrome();
  const greeting = greetingHeadline(session?.name, dict.common);

  return (
    <section data-admin-home className="relative">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-16" />
            <DashboardKpiSkeleton />
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <div className="ro-portal-card h-16 border" />
              <div className="ro-portal-card h-16 border" />
              <div className="ro-portal-card h-16 border" />
              <div className="ro-portal-card h-16 border" />
            </div>
            <div className="grid gap-2.5 lg:grid-cols-12">
              <div className="ro-portal-card order-1 h-40 border lg:order-2 lg:col-span-5" />
              <div className="ro-portal-card order-2 h-64 border lg:order-1 lg:col-span-7" />
              <div className="ro-portal-card order-3 h-32 border lg:col-span-12" />
            </div>
          </div>
        }
      >
        <AdminDashboardBody locale={locale} dict={dict} greeting={greeting} />
      </Suspense>
    </section>
  );
}
