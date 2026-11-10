import Link from "next/link";
import { Suspense } from "react";
import { Bell } from "lucide-react";
import { AdminTableFilters } from "@/components/admin/table-filters";
import { Card, EmptyState, Pill } from "@/components/ui-kit";
import { getAdminHomeData } from "@/lib/admin/dashboard";
import { formatRelative } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { statusToneToPill } from "@/lib/ui/pill-tone";
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

  const filteredEmpty = tab !== "all" || Boolean(q);

  return (
    <section data-admin-notifications="" className="space-y-5 pb-16">
      <header className="rad-phead">
        <div className="min-w-0">
          <h1 style={{ fontFamily: "var(--rad-font, inherit)" }}>
            {u.notificationsTitle}
          </h1>
          <p>
            {u.notificationsLead}
            {" · "}
            <span className="tabular-nums">
              {counts.all} {u.filterAll} · {counts.action}{" "}
              {u.notificationsFilterAction} · {counts.inbox}{" "}
              {u.notificationsFilterInbox} · {counts.trade}{" "}
              {u.notificationsFilterTrade}
            </span>
          </p>
        </div>
      </header>

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
          title={u.notificationsEmpty}
          icon={<Bell width={26} height={26} strokeWidth={1.5} aria-hidden />}
          action={
            <Link
              href={filteredEmpty ? "/admin/notifications" : "/admin/inbox"}
              className="rad-btn rad-gh rad-sm"
            >
              {filteredEmpty ? dict.catalog.clearFilters : dict.admin.openInbox}
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="space-y-2">
              {section.title ? (
                <h2
                  className="text-base font-semibold"
                  style={{
                    color: "var(--rad-tx)",
                    fontFamily: "var(--rad-font, inherit)",
                  }}
                >
                  {section.title}
                </h2>
              ) : null}
              <Card padded={false} className="overflow-hidden">
                <ul className="divide-y divide-[color:var(--rad-bd)]">
                  {section.items.map((item) => {
                    const chip = chipFor(item);
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="flex min-h-11 flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-[background-color,opacity] hover:bg-[color:var(--rad-surface3)]"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="text-[0.65rem] font-semibold uppercase"
                                style={{ color: "var(--rad-tx3)" }}
                              >
                                {domainLabel(item.domain)}
                              </span>
                              {item.ageAt ? (
                                <span
                                  className="text-xs"
                                  style={{ color: "var(--rad-tx3)" }}
                                >
                                  {formatRelative(item.ageAt, locale)}
                                </span>
                              ) : null}
                            </div>
                            <p
                              className="font-medium"
                              style={{ color: "var(--rad-tx)" }}
                            >
                              {item.title}
                            </p>
                            <p
                              className="truncate text-sm"
                              style={{ color: "var(--rad-tx3)" }}
                            >
                              {item.body}
                              {item.subtitle && item.subtitle !== item.body
                                ? ` · ${item.subtitle}`
                                : ""}
                            </p>
                          </div>
                          <Pill tone={statusToneToPill(chip.tone)}>
                            {chip.label}
                          </Pill>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
