import Link from "next/link";
import { Suspense } from "react";
import { Bell } from "lucide-react";
import { PortalHeroStrip } from "@/components/admin/portal-hero";
import { AdminTableFilters } from "@/components/admin/table-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { getAdminHomeData } from "@/lib/admin/dashboard";
import { formatRelative } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getStatusChipProps } from "@/lib/ui/status-labels";
import type { StatusTone } from "@/lib/ui/status";

export const dynamic = "force-dynamic";

type AlertTab = "all" | "action" | "inbox" | "trade";

type AlertItem = {
  id: string;
  section: "action" | "inbox" | "trade";
  domain: "retail" | "deal" | "wholesale" | "inbox";
  href: string;
  title: string;
  body: string;
  subtitle: string;
  ageAt: Date | null;
  status: string | null;
};

/** SYS-01 — admin alerts hub from live queues (no separate notification table). */
export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab: tabRaw, q: qRaw } = await searchParams;
  const tab = (tabRaw?.trim() || "all") as AlertTab;
  const q = qRaw?.trim().toLowerCase() ?? "";
  const { locale, dict } = await getRequestDictionary();
  const ar = locale === "ar";
  const u = dict.adminUi;
  const data = await getAdminHomeData();

  const queueItems: AlertItem[] = data.actionQueue.map((row) => ({
    id: `action-${row.domain}-${row.id}`,
    section:
      row.domain === "deal" || row.domain === "wholesale" ? "trade" : "action",
    domain: row.domain,
    href: row.href,
    title: row.reference,
    body: row.title,
    subtitle: row.subtitle,
    ageAt: row.ageAt,
    status: row.status,
  }));

  const actionItems = queueItems.filter((row) => row.domain === "retail");
  const tradeItems = queueItems.filter(
    (row) => row.domain === "deal" || row.domain === "wholesale"
  );

  const inboxItems: AlertItem[] =
    data.kpis.unreadConversations > 0
      ? [
          {
            id: "inbox-unread",
            section: "inbox",
            domain: "inbox",
            href: "/admin/inbox?tab=unread",
            title: u.notificationsUnreadInbox,
            body: String(data.kpis.unreadConversations),
            subtitle: dict.inbox.tabUnread,
            ageAt: null,
            status: null,
          },
        ]
      : [];

  const allItems = [...actionItems, ...inboxItems, ...tradeItems];

  const counts = {
    all: allItems.length,
    action: actionItems.length,
    inbox: inboxItems.length,
    trade: tradeItems.length,
  };

  let filtered: AlertItem[] =
    tab === "action"
      ? actionItems
      : tab === "inbox"
        ? inboxItems
        : tab === "trade"
          ? tradeItems
          : allItems;

  if (q) {
    filtered = filtered.filter((item) => {
      const hay = [item.title, item.body, item.subtitle]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  const domainLabel = (domain: AlertItem["domain"]) => {
    if (domain === "retail") return u.notificationsDomainRetail;
    if (domain === "deal") return u.notificationsDomainDeal;
    if (domain === "wholesale") return u.notificationsDomainWholesale;
    return u.notificationsFilterInbox;
  };

  const groupedSections: {
    id: AlertItem["section"];
    title: string;
    items: AlertItem[];
  }[] = [
    {
      id: "action",
      title: u.notificationsSectionAction,
      items: filtered.filter((i) => i.section === "action"),
    },
    {
      id: "inbox",
      title: u.notificationsSectionInbox,
      items: filtered.filter((i) => i.section === "inbox"),
    },
    {
      id: "trade",
      title: u.notificationsSectionTrade,
      items: filtered.filter((i) => i.section === "trade"),
    },
  ];

  const sections =
    tab === "all" && !q
      ? groupedSections.filter((s) => s.items.length > 0)
      : ([{ id: "action" as const, title: "", items: filtered }] as const);

  function chipFor(item: AlertItem): { tone: StatusTone; label: string } {
    if (
      item.domain === "retail" ||
      item.domain === "deal" ||
      item.domain === "wholesale"
    ) {
      return getStatusChipProps(
        dict,
        item.domain === "retail"
          ? "retail"
          : item.domain === "deal"
            ? "deal"
            : "wholesale",
        item.status ?? ""
      );
    }
    return { tone: "attention", label: u.notificationsAwaiting };
  }

  return (
    <section className="space-y-5 pb-16">
      <PortalHeroStrip
        eyebrow={ar ? "أشخاص" : "People"}
        title={
          <span className="inline-flex items-center gap-2.5">
            <Bell
              className="size-7 shrink-0 text-[color:var(--ro-accent-fg,var(--ro-plum-800))]"
              strokeWidth={1.5}
            />
            {u.notificationsTitle}
          </span>
        }
        subtitle={u.notificationsLead}
        stats={[
          { label: u.filterAll, value: counts.all },
          { label: u.notificationsFilterAction, value: counts.action },
          { label: u.notificationsFilterInbox, value: counts.inbox },
          { label: u.notificationsFilterTrade, value: counts.trade },
        ]}
      />

      <Suspense fallback={null}>
        <AdminTableFilters
          tabsLabel={u.filterTabs}
          searchLabel={u.search}
          searchPlaceholder={u.searchPlaceholder}
          resultCount={filtered.length}
          resultLabel={u.resultsLabel}
          tabs={[
            { id: "all", label: u.filterAll, count: counts.all },
            {
              id: "action",
              label: u.notificationsFilterAction,
              count: counts.action,
            },
            {
              id: "inbox",
              label: u.notificationsFilterInbox,
              count: counts.inbox,
            },
            {
              id: "trade",
              label: u.notificationsFilterTrade,
              count: counts.trade,
            },
          ]}
        />
      </Suspense>

      {filtered.length === 0 ? (
        <EmptyState
          variant={tab !== "all" || q ? "no-results" : "first-use"}
          title={u.notificationsEmpty}
          actionHref={
            tab !== "all" || q ? "/admin/notifications" : "/admin/inbox"
          }
          actionLabel={
            tab !== "all" || q
              ? dict.catalog.clearFilters
              : dict.admin.openInbox
          }
        />
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="space-y-2">
              {section.title ? (
                <h2 className="font-display text-base font-semibold text-[color:var(--ro-text)]">
                  {section.title}
                </h2>
              ) : null}
              <ul className="ro-portal-card divide-y divide-[color:var(--ro-border-subtle)] overflow-hidden border">
                {section.items.map((item) => {
                  const chip = chipFor(item);
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="ro-row-flash flex min-h-11 flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-[background-color,opacity] duration-[var(--ro-dur-fast)] hover:bg-[color:var(--ro-bg-sunken)]"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-[color:var(--ro-text-muted)]">
                              {domainLabel(item.domain)}
                            </span>
                            {item.ageAt ? (
                              <span className="text-xs text-[color:var(--ro-text-muted)]">
                                {formatRelative(item.ageAt, locale)}
                              </span>
                            ) : null}
                          </div>
                          <p className="font-medium text-[color:var(--ro-text)]">
                            {item.title}
                          </p>
                          <p className="truncate text-sm text-[color:var(--ro-text-muted)]">
                            {item.body}
                            {item.subtitle && item.subtitle !== item.body
                              ? ` · ${item.subtitle}`
                              : ""}
                          </p>
                        </div>
                        <StatusChip size="sm" {...chip} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
