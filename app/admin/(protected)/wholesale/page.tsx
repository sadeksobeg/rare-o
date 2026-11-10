import {
  WholesaleListView,
  type WholesaleListRow,
} from "@/components/admin/rad/wholesale-list-view";
import { getRequestDictionary } from "@/lib/i18n/server";
import { wholesaleNextActor } from "@/lib/ui/status";
import { adminPillToneForStatus } from "@/lib/ui/status-tone";
import { getStatusLabel } from "@/lib/ui/status-labels";
import { WHOLESALE_STATUSES } from "@/lib/wholesale/constants";
import { listWholesaleRequestsForAdmin } from "@/lib/wholesale/service";

const PAGE_SIZE = 40;

export default async function AdminWholesalePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const { tab: tabRaw, q: qRaw, page: pageRaw } = await searchParams;
  const { dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const requests = await listWholesaleRequestsForAdmin();
  const q = qRaw?.trim().toLowerCase() ?? "";
  const tab = tabRaw?.trim() || "all";

  const rows = requests.map((r) => ({
    r,
    waiting: wholesaleNextActor(r.status) === "admin",
  }));

  const counts: Record<string, number> = {
    all: rows.length,
    waiting: rows.filter((x) => x.waiting).length,
  };
  for (const s of WHOLESALE_STATUSES) {
    counts[s] = rows.filter((x) => x.r.status === s).length;
  }

  const filtered = rows.filter(({ r, waiting }) => {
    if (tab === "waiting") {
      if (!waiting) return false;
    } else if (tab !== "all" && r.status !== tab) {
      return false;
    }
    if (!q) return true;
    const hay = [r.reference, r.trader.displayName, r.trader.email]
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
    getStatusLabel(dict, "wholesale", status) ||
    dict.trader.wholesaleStatus[status] ||
    status;

  const listRows: WholesaleListRow[] = pageRows.map(({ r, waiting }) => {
    const shipping =
      [r.carrier, r.trackingReference].filter(Boolean).join(" · ") ||
      u.shippingPlaceholder;
    return {
      id: r.id,
      reference: r.reference,
      traderName: r.trader.displayName,
      traderEmail: r.trader.email,
      modeLabel:
        r.requestMode === "request_quote"
          ? u.modeRequestQuote
          : r.requestMode === "propose_price"
            ? u.modeProposePrice
            : r.requestMode,
      statusLabel: statusLabel(r.status),
      pillTone: adminPillToneForStatus("wholesale", r.status),
      waiting,
      waitingLabel: u.waitingOnYou,
      shipping,
      lines: r._count.lines,
      href: `/admin/wholesale/${r.id}`,
    };
  });

  return (
    <WholesaleListView
      title={a.wholesale}
      lead={u.wholesaleLead}
      tabs={[
        { value: "all", label: u.filterAll, count: counts.all },
        {
          value: "waiting",
          label: u.filterWaiting,
          count: counts.waiting,
        },
        ...WHOLESALE_STATUSES.map((s) => ({
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
        listAria: a.wholesale,
        statusFilterAria: u.filterTabs,
        searchLabel: u.search,
        searchPlaceholder: u.searchWholesale,
        colReference: u.colReference,
        colTrader: u.colTrader,
        colMode: u.colMode,
        colStatus: a.colStatus,
        colShipping: u.colShipping,
        colLines: u.colLines,
        colActions: u.actionReview,
        emptyTitle: u.wholesaleEmptyTitle,
        emptyBody: u.wholesaleEmptyBody,
        noResultsTitle: u.wholesaleEmptyFilteredTitle,
        noResultsBody: u.wholesaleEmptyFilteredBody,
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
