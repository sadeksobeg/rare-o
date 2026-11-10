import { CustomersListView } from "@/components/admin/rad/customers-list-view";
import { buildCustomersFixture } from "@/lib/dev/ui-kit-fixtures";
import { getRequestDictionary } from "@/lib/i18n/server";

const PAGE_SIZE = 40;

export default async function DevUiKitCustomersPage() {
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const { rows, tabs, total } = buildCustomersFixture(dict, locale);

  return (
    <CustomersListView
      title={a.customers}
      lead={u.customersLead}
      tabs={tabs}
      query={{ tab: "all", q: "", page: 1 }}
      rows={rows}
      totalFiltered={total}
      pageCount={1}
      pageSize={PAGE_SIZE}
      labels={{
        listAria: a.customers,
        statusFilterAria: u.filterTabs,
        searchLabel: u.search,
        searchPlaceholder: u.searchCustomers,
        colName: a.colName,
        colPhone: u.colPhone,
        colRequests: u.colRequests,
        colLastActivity: u.colLastActivity,
        colWa: u.colWa,
        colCreated: u.colCreated,
        colActions: a.customers,
        emptyTitle: u.emptyTitle,
        emptyBody: u.emptyBody,
        noResultsTitle: u.emptyTitle,
        noResultsBody: u.emptyBody,
        clearFilters: dict.catalog.clearFilters,
        paginationSummary: u.listPaginationSummary,
        paginationPrevious: dict.common.paginationPrevious,
        paginationNext: dict.common.paginationNext,
        requestsHref: "/admin/requests",
        requestsLabel: a.requests,
      }}
    />
  );
}
