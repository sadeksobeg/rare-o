import { Suspense, type ReactNode } from "react";
import {
  Boxes,
  Compass,
  Handshake,
  MessageSquare,
  Package,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { ActionQueue } from "@/components/admin/action-queue";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { DashboardAside } from "@/components/admin/dashboard-aside";
import { DashboardDomainChartMount } from "@/components/admin/dashboard-domain-chart-mount";
import { DashboardRequestsChartMount } from "@/components/admin/dashboard-requests-chart-mount";
import { KpiTile, type KpiTone } from "@/components/admin/kpi-tile";
import { ManageHub } from "@/components/admin/manage-hub";
import { AdminQuickCreate } from "@/components/admin/quick-create";
import { EmptyState } from "@/components/ui/empty-state";
import { getAdminHomeData, type KpiSeries } from "@/lib/admin/dashboard";
import { getAdminSessionChrome } from "@/lib/auth/admin-session";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/format";
import { greetingHeadline } from "@/lib/i18n/greeting";
import { getRequestDictionary } from "@/lib/i18n/server";
import { fmt } from "@/lib/ui/trader-labels";

export const dynamic = "force-dynamic";

function whatsappPulseLabel(dict: Dictionary, state: string): string {
  switch (state) {
    case "CONNECTED":
      return dict.inbox.healthConnected;
    case "CONNECTING":
      return dict.inbox.healthConnecting;
    case "RECONNECTING":
      return dict.inbox.healthReconnecting;
    case "AUTHENTICATION_REQUIRED":
      return dict.inbox.healthAuthRequired;
    case "ERROR":
      return dict.inbox.healthError;
    case "DISCONNECTED":
    default:
      return dict.inbox.healthDisconnected;
  }
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

  const isFirstUse =
    waiting === 0 &&
    data.kpis.activeBrokerage === 0 &&
    data.manageHub.publishedProducts === 0 &&
    data.manageHub.traders === 0 &&
    data.manageHub.customers === 0 &&
    data.actionQueue.length === 0;

  const kpis: {
    label: string;
    value: number;
    href: string;
    series?: KpiSeries;
    tone: KpiTone;
    icon: ReactNode;
  }[] = [
    {
      label: a.kpiRetail,
      value: data.kpis.retailAwaitingAdmin,
      href: "/admin/requests?tab=waiting",
      series: data.series.retail,
      tone: "amber",
      icon: <ShoppingBag className="size-4" strokeWidth={1.5} aria-hidden />,
    },
    {
      label: a.kpiDeals,
      value: data.kpis.dealsAwaitingAdmin,
      href: "/admin/deals?tab=waiting",
      series: data.series.deals,
      tone: "plum",
      icon: <Handshake className="size-4" strokeWidth={1.5} aria-hidden />,
    },
    {
      label: a.kpiWholesale,
      value: data.kpis.wholesaleAwaitingAdmin,
      href: "/admin/wholesale?tab=waiting",
      series: data.series.wholesale,
      tone: "progress",
      icon: <Package className="size-4" strokeWidth={1.5} aria-hidden />,
    },
    {
      label: a.kpiBrokerage,
      value: data.kpis.activeBrokerage,
      href: "/admin/brokerage?status=active",
      tone: "success",
      icon: <Compass className="size-4" strokeWidth={1.5} aria-hidden />,
    },
  ];

  const waLive = data.health.state === "CONNECTED";

  return (
    <div className="ro-admin-home-bleed relative flex w-full flex-col">
      {/* 1. Full-bleed greeting ops bar */}
      <div className="ro-admin-greeting">
        <div className="ro-admin-home-pad relative flex flex-wrap items-end justify-between gap-3 py-4 sm:py-5">
          <div className="min-w-0 space-y-1">
            <p className="flex items-center gap-2 text-xs font-medium text-[color-mix(in_srgb,var(--ro-sand-100)_70%,transparent)] sm:text-sm">
              <span className="relative inline-flex size-2 rounded-full bg-[var(--ro-success-700)]">
                {waLive ? (
                  <span className="absolute inset-0 animate-ping rounded-full bg-[var(--ro-success-700)] motion-reduce:animate-none" />
                ) : null}
              </span>
              {whatsappPulseLabel(dict, data.health.state)}
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.85rem]">
              {greeting}
            </h1>
            <p className="text-sm text-[color-mix(in_srgb,var(--ro-sand-100)_68%,transparent)]">
              {description}
            </p>
          </div>
          <svg
            className="pointer-events-none absolute inset-x-0 bottom-0 h-6 w-full text-[color-mix(in_srgb,var(--ro-plum-300)_40%,transparent)]"
            viewBox="0 0 1200 32"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M0 20 C 200 4, 400 28, 600 14 S 1000 2, 1200 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
            />
          </svg>
        </div>
      </div>

      {isFirstUse ? (
        <div className="ro-admin-home-pad py-3">
          <EmptyState
            variant="first-use"
            title={a.firstUseTitle}
            body={a.firstUseBody}
            actionHref="/admin/products/new"
            actionLabel={a.firstUseAction}
          />
        </div>
      ) : null}

      {/* 2. Edge-to-edge KPI strip */}
      <div className="ro-admin-kpi-strip">
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
            className="rounded-none border-0 p-4 sm:p-5"
          />
        ))}
      </div>

      {/* 3. Hero queue + supporting charts */}
      <div className="ro-admin-home-pad grid items-stretch gap-3 py-3 lg:grid-cols-12 lg:gap-4 lg:py-4">
        <ActionQueue
          rows={data.actionQueue}
          counts={{
            retail: data.kpis.retailAwaitingAdmin,
            deal: data.kpis.dealsAwaitingAdmin,
            wholesale: data.kpis.wholesaleAwaitingAdmin,
          }}
          dict={dict}
          locale={locale}
          className="min-h-[22rem] lg:col-span-8"
        />
        <div className="grid gap-3 lg:col-span-4">
          <DashboardRequestsChartMount
            title={a.requestsOverDays}
            totalLabel={a.requestsOverDaysTotal}
            points={data.requestsTrend.points}
            total={data.requestsTrend.total}
            emptyTitle={a.firstUseTitle}
            emptyBody={a.firstUseBody}
            emptyActionHref="/admin/products/new"
            emptyActionLabel={a.firstUseAction}
          />
          <DashboardDomainChartMount
            title={a.domainMixTitle}
            emptyTitle={a.firstUseTitle}
            emptyBody={a.firstUseBody}
            emptyActionHref="/admin/products/new"
            emptyActionLabel={a.firstUseAction}
            slices={[
              {
                key: "retail",
                label: a.kpiRetail,
                value: data.kpis.retailAwaitingAdmin,
                color: "var(--ro-plum-700)",
              },
              {
                key: "deals",
                label: a.kpiDeals,
                value: data.kpis.dealsAwaitingAdmin,
                color: "var(--ro-plum-300)",
              },
              {
                key: "wholesale",
                label: a.kpiWholesale,
                value: data.kpis.wholesaleAwaitingAdmin,
                color: "var(--ro-amber-500)",
              },
              {
                key: "brokerage",
                label: a.kpiBrokerage,
                value: data.kpis.activeBrokerage,
                color: "var(--ro-progress-700)",
              },
            ]}
          />
        </div>
      </div>

      <AdminQuickCreate
        label={a.quickCreate}
        closeLabel={dict.common.close}
        items={[
          { href: "/admin/products/new", label: a.newProduct, icon: "product" },
          { href: "/admin/offers/new", label: dict.adminUi.newOffer, icon: "offer" },
          { href: "/admin/traders", label: dict.adminUi.newTrader, icon: "trader" },
          {
            href: "/admin/brokerage",
            label: dict.trader.newBrokerage,
            icon: "brokerage",
          },
        ]}
      />

      {/* 4. Dense ops footer */}
      <div className="ro-admin-home-pad space-y-3 border-t border-[color:var(--ro-border-subtle)] py-3 pb-24 lg:pb-4">
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

        <div className="grid items-start gap-3 lg:grid-cols-12">
          <DashboardAside
            health={data.health}
            lastWhatsAppAt={data.lastWhatsAppAt}
            catalogHealth={data.catalogHealth}
            pipeline={data.pipeline}
            dict={dict}
            locale={locale}
            className="lg:col-span-5"
          />
          <ActivityFeed
            items={data.activityFeed}
            dict={dict}
            locale={locale}
            className="lg:col-span-7"
          />
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const { locale, dict } = await getRequestDictionary();
  const session = await getAdminSessionChrome();
  const greeting = greetingHeadline(session?.name, dict.common);

  return (
    <section
      data-admin-home
      className="relative w-full min-w-0 max-w-none"
      style={{ width: "100%", maxWidth: "none" }}
    >
      <Suspense
        fallback={
          <div className="ro-admin-home-bleed">
            <div className="ro-admin-greeting h-24" />
            <div className="ro-admin-kpi-strip">
              <div className="h-[7.25rem]" />
              <div className="h-[7.25rem]" />
              <div className="h-[7.25rem]" />
              <div className="h-[7.25rem]" />
            </div>
          </div>
        }
      >
        <AdminDashboardBody locale={locale} dict={dict} greeting={greeting} />
      </Suspense>
    </section>
  );
}
