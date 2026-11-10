import { WholesaleListView } from "@/components/admin/rad/wholesale-list-view";
import { buildWholesaleFixture } from "@/lib/dev/ui-kit-fixtures";
import { getRequestDictionary } from "@/lib/i18n/server";

const PAGE_SIZE = 40;

export default async function DevUiKitWholesalePage() {
  const { dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const { rows, tabs, total } = buildWholesaleFixture(dict);

  return (
    <WholesaleListView
      title={a.wholesale}
      lead={u.wholesaleLead}
      tabs={tabs}
      query={{ tab: "all", q: "", page: 1 }}
      rows={rows}
      totalFiltered={total}
      pageCount={1}
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
