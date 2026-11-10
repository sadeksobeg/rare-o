import {
  DealsListView,
  type DealsListRow,
} from "@/components/admin/rad/deals-list-view";
import { DEAL_STATUSES } from "@/lib/deals/constants";
import { listDealsForAdmin } from "@/lib/deals/service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { dealNextActor } from "@/lib/ui/status";
import { adminPillToneForStatus } from "@/lib/ui/status-tone";
import { getStatusLabel } from "@/lib/ui/status-labels";

const PAGE_SIZE = 40;

export default async function AdminDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const { tab: tabRaw, q: qRaw, page: pageRaw } = await searchParams;
  const { dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const deals = await listDealsForAdmin();
  const q = qRaw?.trim().toLowerCase() ?? "";

  const rows = deals.map((d) => {
    const last = (d.entries[0]?.actorRole ?? null) as "trader" | "admin" | null;
    const waiting = dealNextActor(d.status, last) === "admin";
    return { d, waiting, last };
  });

  const counts: Record<string, number> = {
    all: rows.length,
    waiting: rows.filter((r) => r.waiting).length,
  };
  for (const s of DEAL_STATUSES) {
    counts[s] = rows.filter((r) => r.d.status === s).length;
  }

  const tab = tabRaw?.trim() || "all";
  const filtered = rows.filter(({ d, waiting }) => {
    if (tab === "waiting") {
      if (!waiting) return false;
    } else if (tab !== "all" && d.status !== tab) {
      return false;
    }
    if (!q) return true;
    const hay = [d.reference, d.title, d.trader.displayName, d.trader.email]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  const page = Math.max(1, Number.parseInt(pageRaw || "1", 10) || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageRows = filtered.slice(
    (pageSafe - 1) * PAGE_SIZE,
    pageSafe * PAGE_SIZE
  );

  const statusLabel = (status: string) =>
    getStatusLabel(dict, "deal", status) ||
    dict.trader.dealStatus[status] ||
    status;

  const listRows: DealsListRow[] = pageRows.map(({ d, waiting }) => ({
    id: d.id,
    reference: d.reference,
    title: d.title,
    traderName: d.trader.displayName,
    traderEmail: d.trader.email,
    kindLabel:
      d.dealKind === "catalog"
        ? u.kindCatalog
        : d.dealKind === "non_catalog"
          ? u.kindNonCatalog
          : d.dealKind,
    statusLabel: statusLabel(d.status),
    pillTone: adminPillToneForStatus("deal", d.status),
    waiting,
    waitingLabel: u.waitingOnYou,
    entries: d._count.entries,
    href: `/admin/deals/${d.id}`,
  }));

  return (
    <DealsListView
      title={a.deals}
      lead={u.dealsLead}
      tabs={[
        { value: "all", label: u.filterAll, count: counts.all },
        {
          value: "waiting",
          label: u.filterWaiting,
          count: counts.waiting,
        },
        ...DEAL_STATUSES.map((s) => ({
          value: s,
          label: statusLabel(s),
          count: counts[s] ?? 0,
        })),
      ]}
      query={{ tab, q: qRaw?.trim() ?? "", page: pageSafe }}
      rows={listRows}
      totalFiltered={filtered.length}
      pageCount={pageCount}
      pageSize={PAGE_SIZE}
      labels={{
        listAria: a.deals,
        statusFilterAria: u.filterTabs,
        searchLabel: u.search,
        searchPlaceholder: u.searchDeals,
        colReference: u.colReference,
        colTrader: u.colTrader,
        colTitle: u.colTitle,
        colKind: u.colKind,
        colStatus: a.colStatus,
        colEntries: u.colEntries,
        colActions: u.actionNegotiate,
        emptyTitle: u.dealsEmptyTitle,
        emptyBody: u.dealsEmptyBody,
        noResultsTitle: u.dealsEmptyFilteredTitle,
        noResultsBody: u.dealsEmptyFilteredBody,
        clearFilters: dict.catalog.clearFilters,
        paginationSummary: u.listPaginationSummary,
        paginationPrevious: dict.common.paginationPrevious,
        paginationNext: dict.common.paginationNext,
        tradersHref: "/admin/traders",
        newTrader: u.newTrader,
      }}
    />
  );
}
