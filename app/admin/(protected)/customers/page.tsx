import {
  CustomersListView,
  type CustomersListRow,
} from "@/components/admin/rad/customers-list-view";
import { phonesWithWhatsAppMatch } from "@/lib/admin/wa-phone-match";
import { uiVisibleCustomerWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import { containsCI } from "@/lib/db/search";
import { formatAdminDate } from "@/lib/i18n/admin-format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { formatMaskedPhone } from "@/lib/whatsapp/messaging/phone-format";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; page?: string }>;
}) {
  const { q: qRaw, tab: tabRaw, page: pageRaw } = await searchParams;
  const query = qRaw?.trim() ?? "";
  const tab = tabRaw?.trim() || "all";
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;

  const visible = uiVisibleCustomerWhere();

  const searchWhere: Prisma.CustomerWhereInput | undefined = query
    ? {
        OR: [{ name: containsCI(query) }, { phone: containsCI(query) }],
      }
    : undefined;

  const tabWhere: Prisma.CustomerWhereInput | undefined =
    tab === "with_requests"
      ? { requests: { some: {} } }
      : tab === "no_requests"
        ? { requests: { none: {} } }
        : undefined;

  const listWhere: Prisma.CustomerWhereInput = {
    AND: [visible, searchWhere, tabWhere].filter(
      Boolean
    ) as Prisma.CustomerWhereInput[],
  };

  const [allCount, withRequestsCount, customers] = await Promise.all([
    prisma.customer.count({ where: visible }),
    prisma.customer.count({
      where: { AND: [visible, { requests: { some: {} } }] },
    }),
    prisma.customer.findMany({
      where: listWhere,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        _count: {
          select: { requests: true, whatsAppConversations: true },
        },
        requests: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, reference: true },
        },
      },
    }),
  ]);

  const noRequestsCount = Math.max(0, allCount - withRequestsCount);
  const waPhones = await phonesWithWhatsAppMatch(customers.map((c) => c.phone));

  const page = Math.max(1, Number.parseInt(pageRaw || "1", 10) || 1);
  const pageCount = Math.max(1, Math.ceil(customers.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageSlice = customers.slice(
    (pageSafe - 1) * PAGE_SIZE,
    pageSafe * PAGE_SIZE
  );

  const rows: CustomersListRow[] = pageSlice.map((c) => {
    const last = c.requests[0];
    const hasWa =
      c._count.whatsAppConversations > 0 || waPhones.has(c.phone);
    return {
      id: c.id,
      name: c.name,
      phoneMasked: formatMaskedPhone(c.phone) || c.phone,
      requestCount: c._count.requests,
      lastActivity: last ? formatAdminDate(last.createdAt, locale) : "—",
      lastReference: last?.reference ?? null,
      hasWa,
      createdLabel: formatAdminDate(c.createdAt, locale, { forceAbsolute: true }),
      href: `/admin/customers/${c.id}`,
    };
  });

  return (
    <CustomersListView
      title={a.customers}
      lead={u.customersLead}
      tabs={[
        { value: "all", label: u.filterAll, count: allCount },
        {
          value: "with_requests",
          label: u.customersFilterWithRequests,
          count: withRequestsCount,
        },
        {
          value: "no_requests",
          label: u.customersFilterNoRequests,
          count: noRequestsCount,
        },
      ]}
      query={{ tab, q: query, page: pageSafe }}
      rows={rows}
      totalFiltered={customers.length}
      pageCount={pageCount}
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
