import { DealsListView } from "@/components/admin/rad/deals-list-view";
import { buildDealsFixture } from "@/lib/dev/ui-kit-fixtures";
import { getRequestDictionary } from "@/lib/i18n/server";

const PAGE_SIZE = 40;

export default async function DevUiKitDealsPage() {
  const { dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const { rows, tabs, total } = buildDealsFixture(dict);

  return (
    <DealsListView
      title={a.deals}
      lead={u.dealsLead}
      tabs={tabs}
      query={{ tab: "all", q: "", page: 1 }}
      rows={rows}
      totalFiltered={total}
      pageCount={1}
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
