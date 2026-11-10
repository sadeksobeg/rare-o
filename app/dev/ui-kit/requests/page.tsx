import { RequestsListView } from "@/components/admin/rad/requests-list-view";
import { buildRequestsFixture } from "@/lib/dev/ui-kit-fixtures";
import { getRequestDictionary } from "@/lib/i18n/server";

const PAGE_SIZE = 40;

export default async function DevUiKitRequestsPage() {
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const { rows, tabs, total } = buildRequestsFixture(dict, locale);

  return (
    <RequestsListView
      title={a.requests}
      lead={
        <>
          <b className="rad-num">{total}</b>
          {" · "}
          {u.requestsLead}
        </>
      }
      tabs={tabs}
      query={{ tab: "all", q: "", page: 1, sort: "created", dir: "desc", view: "table" }}
      rows={rows}
      totalFiltered={total}
      pageCount={1}
      pageSize={PAGE_SIZE}
      locale={locale}
      labels={{
        listAria: a.requests,
        statusFilterAria: u.filterTabs,
        searchLabel: u.search,
        searchPlaceholder: u.searchRequests,
        sortNewest: u.sortNewestFirst,
        sortOldest: u.sortOldestFirst,
        colReference: u.colReference,
        colCustomer: u.colCustomer,
        colProducts: u.colItems,
        colValue: u.colTotal,
        colStatus: a.colStatus,
        colHandoff: u.colHandoff,
        colCreated: u.colCreated,
        colActions: u.actionView,
        moreProducts: u.moreProducts,
        emptyTitle: u.requestsEmptyTitle,
        emptyBody: u.requestsEmptyBody,
        noResultsTitle: u.noResultsForQuery,
        noResultsBody: u.noResultsHint,
        clearFilters: dict.catalog.clearFilters,
        paginationSummary: u.listPaginationSummary,
        paginationPrevious: dict.common.paginationPrevious,
        paginationNext: dict.common.paginationNext,
        viewTable: u.viewTable,
        viewKanban: u.viewKanban,
      }}
    />
  );
}
