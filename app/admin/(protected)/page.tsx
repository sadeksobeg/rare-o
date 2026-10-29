import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import {
  Boxes,
  Compass,
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
import { ManageHub } from "@/components/admin/manage-hub";
import { PageHeader } from "@/components/admin/page-header";
import { ButtonLink } from "@/components/ui/button";
import { getAdminHomeData } from "@/lib/admin/dashboard";
import { getAdminSessionChrome } from "@/lib/auth/admin-session";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/format";
import { greetingHeadline } from "@/lib/i18n/greeting";
import { getRequestDictionary } from "@/lib/i18n/server";
import { fmt } from "@/lib/ui/trader-labels";

export const dynamic = "force-dynamic";

function KpiCard({
  label,
  value,
  href,
  icon,
  idleLabel,
}: {
  label: string;
  value: number;
  href: string;
  icon: ReactNode;
  idleLabel: string;
}) {
  return (
    <Link
      href={href}
      className="ro-portal-card flex flex-col gap-2 border p-3 transition-opacity hover:opacity-95"
    >
      <div className="flex items-center justify-between gap-2 text-[var(--ro-ink-600)]">
        <span className="text-xs font-medium">{label}</span>
        {icon}
      </div>
      <div className="font-display text-2xl font-semibold tabular-nums text-ro-ink">
        {value}
      </div>
      {value === 0 ? (
        <span className="text-[0.7rem] text-[var(--ro-ink-600)]">{idleLabel}</span>
      ) : null}
    </Link>
  );
}

function DomainBreakdown({
  title,
  slices,
}: {
  title: string;
  slices: { key: string; label: string; value: number; color: string }[];
}) {
  const max = Math.max(...slices.map((s) => s.value), 1);
  return (
    <div className="rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-4">
      <h2 className="font-display text-lg font-semibold text-ro-ink">{title}</h2>
      <ul className="mt-3 space-y-2.5">
        {slices.map((s) => (
          <li key={s.key} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ background: s.color }}
                />
                {s.label}
              </span>
              <span className="tabular-nums text-[var(--ro-ink-600)]">
                {s.value}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--ro-ink-950)_8%,transparent)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round((s.value / max) * 100)}%`,
                  background: s.color,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
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

  return (
    <div className="relative space-y-6">
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

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <KpiCard
          label={a.kpiRetail}
          value={data.kpis.retailAwaitingAdmin}
          href="/admin/requests?tab=waiting"
          idleLabel={a.kpiIdle}
          icon={<ShoppingBag className="size-4" strokeWidth={1.5} aria-hidden />}
        />
        <KpiCard
          label={a.kpiDeals}
          value={data.kpis.dealsAwaitingAdmin}
          href="/admin/deals?tab=waiting"
          idleLabel={a.kpiIdle}
          icon={<Handshake className="size-4" strokeWidth={1.5} aria-hidden />}
        />
        <KpiCard
          label={a.kpiWholesale}
          value={data.kpis.wholesaleAwaitingAdmin}
          href="/admin/wholesale?tab=waiting"
          idleLabel={a.kpiIdle}
          icon={<Package className="size-4" strokeWidth={1.5} aria-hidden />}
        />
        <KpiCard
          label={a.kpiBrokerage}
          value={data.kpis.activeBrokerage}
          href="/admin/brokerage"
          idleLabel={a.kpiIdle}
          icon={<Compass className="size-4" strokeWidth={1.5} aria-hidden />}
        />
      </div>

      <DomainBreakdown
        title={
          locale === "ar" ? "توزيع الانتظار حسب النطاق" : "Waiting by domain"
        }
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

      <div className="grid items-start gap-2.5 lg:grid-cols-12">
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
    </div>
  );
}

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
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <div className="ro-portal-card h-24 border" />
              <div className="ro-portal-card h-24 border" />
              <div className="ro-portal-card h-24 border" />
              <div className="ro-portal-card h-24 border" />
            </div>
          </div>
        }
      >
        <AdminDashboardBody locale={locale} dict={dict} greeting={greeting} />
      </Suspense>
    </section>
  );
}
