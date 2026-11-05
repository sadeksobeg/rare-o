import { Suspense, type ReactNode } from "react";
import {
  Boxes,
  Compass,
  Handshake,
  Inbox,
  MessageSquare,
  Package,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import {
  ActionQueue,
  type QueueFilter,
} from "@/components/admin/action-queue";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { DashboardAside } from "@/components/admin/dashboard-aside";
import { DashboardDomainChartMount } from "@/components/admin/dashboard-domain-chart-mount";
import { DashboardGreeting } from "@/components/admin/dashboard-greeting";
import { DashboardRequestsChartMount } from "@/components/admin/dashboard-requests-chart-mount";
import {
  DashboardSection,
  DashboardStack,
} from "@/components/admin/dashboard-section";
import { type KpiTone } from "@/components/admin/kpi-tile";
import { KpiStrip } from "@/components/admin/kpi-strip";
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

function parseDomain(raw: string | undefined): QueueFilter | "brokerage" | null {
  if (!raw) return null;
  if (raw === "retail" || raw === "deal" || raw === "wholesale") return raw;
  if (raw === "brokerage") return "brokerage";
  if (raw === "all") return "all";
  return null;
}

function queueFilterFromDomain(
  domain: QueueFilter | "brokerage" | null
): QueueFilter {
  if (domain === "retail" || domain === "deal" || domain === "wholesale") {
    return domain;
  }
  return "all";
}

async function AdminDashboardBody({
  locale,
  dict,
  greeting,
  domainParam,
}: {
  locale: Locale;
  dict: Dictionary;
  greeting: string;
  domainParam: QueueFilter | "brokerage" | null;
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

  const activeId = domainParam ?? "waiting";
  const queueFilter = queueFilterFromDomain(domainParam);

  const pathKpis: {
    id: string;
    label: string;
    value: number;
    href: string;
    series?: KpiSeries;
    tone: KpiTone;
    icon: ReactNode;
  }[] = [
    {
      id: "retail",
      label: a.kpiRetail,
      value: data.kpis.retailAwaitingAdmin,
      href: "/admin?domain=retail",
      series: data.series.retail,
      tone: "amber",
      icon: <ShoppingBag className="size-4" strokeWidth={1.5} aria-hidden />,
    },
    {
      id: "deal",
      label: a.kpiDeals,
      value: data.kpis.dealsAwaitingAdmin,
      href: "/admin?domain=deal",
      series: data.series.deals,
      tone: "plum",
      icon: <Handshake className="size-4" strokeWidth={1.5} aria-hidden />,
    },
    {
      id: "wholesale",
      label: a.kpiWholesale,
      value: data.kpis.wholesaleAwaitingAdmin,
      href: "/admin?domain=wholesale",
      series: data.series.wholesale,
      tone: "progress",
      icon: <Package className="size-4" strokeWidth={1.5} aria-hidden />,
    },
    {
      id: "brokerage",
      label: a.kpiBrokerage,
      value: data.kpis.activeBrokerage,
      href: "/admin?domain=brokerage",
      tone: "success",
      icon: <Compass className="size-4" strokeWidth={1.5} aria-hidden />,
    },
  ];

  const waLive = data.health.state === "CONNECTED";
  const chartDomain =
    domainParam === "brokerage"
      ? "brokerage"
      : domainParam && domainParam !== "all"
        ? domainParam
        : null;

  return (
    <DashboardStack className="ro-admin-home-bleed relative w-full">
      <DashboardSection>
        <DashboardGreeting
          greeting={greeting}
          description={description}
          statusLabel={whatsappPulseLabel(dict, data.health.state)}
          statusLive={waLive}
        />
      </DashboardSection>

      {isFirstUse ? (
        <DashboardSection className="ro-admin-home-pad py-3">
          <EmptyState
            variant="first-use"
            title={a.firstUseTitle}
            body={a.firstUseBody}
            actionHref="/admin/products/new"
            actionLabel={a.firstUseAction}
          />
        </DashboardSection>
      ) : null}

      <DashboardSection>
        <KpiStrip
          activeId={activeId}
          hero={{
            id: "waiting",
            label: a.kpiWaitingTotal,
            value: waiting,
            href: "/admin",
            idleLabel: a.kpiIdle,
            tone: "plum",
            icon: <Inbox className="size-4" strokeWidth={1.5} aria-hidden />,
            series:
              data.requestsTrend.points.length >= 7
                ? {
                    points: data.requestsTrend.points,
                    today:
                      data.requestsTrend.points[
                        data.requestsTrend.points.length - 1
                      ] ?? 0,
                    yesterday:
                      data.requestsTrend.points[
                        data.requestsTrend.points.length - 2
                      ] ?? 0,
                  }
                : undefined,
          }}
          items={pathKpis.map((kpi) => ({
            ...kpi,
            idleLabel: a.kpiIdle,
          }))}
        />
      </DashboardSection>

      <DashboardSection className="ro-admin-home-pad grid items-stretch gap-3 py-3 lg:grid-cols-12 lg:gap-4 lg:py-4">
        <ActionQueue
          rows={data.actionQueue}
          counts={{
            retail: data.kpis.retailAwaitingAdmin,
            deal: data.kpis.dealsAwaitingAdmin,
            wholesale: data.kpis.wholesaleAwaitingAdmin,
          }}
          filter={queueFilter}
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
            highlightDomain={chartDomain}
            emptyTitle={a.firstUseTitle}
            emptyBody={a.firstUseBody}
            emptyActionHref="/admin/products/new"
            emptyActionLabel={a.firstUseAction}
          />
          <DashboardDomainChartMount
            title={a.domainMixTitle}
            highlightDomain={chartDomain}
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
      </DashboardSection>

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

      <DashboardSection className="ro-admin-home-pad space-y-3 border-t border-[color:var(--ro-border-subtle)] py-3 pb-24 lg:pb-4">
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
      </DashboardSection>
    </DashboardStack>
  );
}

function DashboardSkeleton() {
  return (
    <div className="ro-admin-home-bleed" aria-busy="true">
      <div className="ro-admin-greeting h-[7.5rem] sm:h-[8.25rem]" />
      <div className="ro-admin-kpi-stack">
        <div className="ro-admin-kpi-hero">
          <div className="h-[7.5rem] rounded-[1rem] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)]" />
        </div>
        <div className="ro-admin-kpi-strip">
          <div className="ro-admin-kpi-cell h-[9.5rem] rounded-[1rem] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)]" />
          <div className="ro-admin-kpi-cell h-[9.5rem] rounded-[1rem] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)]" />
          <div className="ro-admin-kpi-cell h-[9.5rem] rounded-[1rem] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)]" />
          <div className="ro-admin-kpi-cell h-[9.5rem] rounded-[1rem] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)]" />
        </div>
      </div>
      <div className="ro-admin-home-pad grid gap-3 py-3 lg:grid-cols-12">
        <div className="min-h-[22rem] rounded-[var(--ro-r-lg)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)] lg:col-span-8" />
        <div className="grid gap-3 lg:col-span-4">
          <div className="h-[220px] rounded-[var(--ro-r-lg)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)]" />
          <div className="h-[200px] rounded-[var(--ro-r-lg)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)]" />
        </div>
      </div>
      <div className="ro-admin-home-pad space-y-3 border-t border-[color:var(--ro-border-subtle)] py-3">
        <div className="h-16 rounded-[var(--ro-r-lg)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)]" />
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="h-40 rounded-[var(--ro-r-lg)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)] lg:col-span-5" />
          <div className="h-56 rounded-[var(--ro-r-lg)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)] lg:col-span-7" />
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const { locale, dict } = await getRequestDictionary();
  const session = await getAdminSessionChrome();
  const greeting = greetingHeadline(session?.name, dict.common);
  const { domain: domainRaw } = await searchParams;
  const domainParam = parseDomain(domainRaw);

  return (
    <section
      data-admin-home
      className="relative w-full min-w-0 max-w-none"
      style={{ width: "100%", maxWidth: "none" }}
    >
      <Suspense fallback={<DashboardSkeleton />}>
        <AdminDashboardBody
          locale={locale}
          dict={dict}
          greeting={greeting}
          domainParam={domainParam}
        />
      </Suspense>
    </section>
  );
}
