import Link from "next/link";
import {
  RequestsListView,
  type RequestsListRow,
} from "@/components/admin/rad/requests-list-view";
import { RetailKanbanBoard } from "@/components/admin/retail-kanban";
import { uiVisibleRetailRequestWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import { containsCI } from "@/lib/db/search";
import {
  formatAdminListCreated,
  formatAdminMoneyOrNull,
} from "@/lib/i18n/admin-format";
import { getRequestDictionary } from "@/lib/i18n/server";
import {
  RETAIL_REQUEST_STATUSES,
  isRetailRequestStatus,
} from "@/lib/retail-request/constants";
import { isFresh } from "@/lib/ui/fresh";
import { statusesAwaitingAdmin } from "@/lib/ui/status";
import { adminPillToneForStatus } from "@/lib/ui/status-tone";
import { getStatusLabel } from "@/lib/ui/status-labels";
import { formatMaskedPhone } from "@/lib/whatsapp/messaging/phone-format";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 40;

const SORTABLE_FIELDS = {
  reference: "reference",
  status: "status",
  created: "createdAt",
} as const;
type SortField = keyof typeof SORTABLE_FIELDS;
function isSortField(v: string | undefined): v is SortField {
  return !!v && v in SORTABLE_FIELDS;
}

function handoffLabel(
  u: {
    handoffOpened: string;
    handoffPrepared: string;
    handoffNone: string;
  },
  openedAt: Date | null,
  preparedAt: Date | null
) {
  if (openedAt) return u.handoffOpened;
  if (preparedAt) return u.handoffPrepared;
  return u.handoffNone;
}

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    page?: string;
    view?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const {
    tab: tabRaw,
    q: qRaw,
    page: pageRaw,
    view: viewRaw,
    sort: sortRaw,
    dir: dirRaw,
  } = await searchParams;
  const view = viewRaw === "kanban" ? "kanban" : "table";
  const sortField = isSortField(sortRaw) ? sortRaw : "created";
  const sortDir = dirRaw === "asc" ? "asc" : "desc";
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;

  const q = qRaw?.trim() ?? "";
  const tab = tabRaw?.trim() || "all";
  const pageRequested = Math.max(
    1,
    Number.parseInt(pageRaw || "1", 10) || 1
  );

  const waitingStatuses = statusesAwaitingAdmin("retail");
  const statusFilter =
    tab !== "all" && tab !== "waiting" && isRetailRequestStatus(tab)
      ? tab
      : undefined;

  const where: Prisma.RetailRequestWhereInput = {
    AND: [
      uiVisibleRetailRequestWhere(),
      ...(tab === "waiting" ? [{ status: { in: waitingStatuses } }] : []),
      ...(statusFilter ? [{ status: statusFilter }] : []),
      ...(q
        ? [
            {
              OR: [
                { reference: containsCI(q) },
                { customerName: containsCI(q) },
                { customerPhone: containsCI(q) },
                {
                  lines: {
                    some: {
                      OR: [
                        { productNameAr: containsCI(q) },
                        { productNameEn: containsCI(q) },
                      ],
                    },
                  },
                },
              ],
            },
          ]
        : []),
    ],
  };

  const [totalFiltered, statusGroups] = await Promise.all([
    prisma.retailRequest.count({ where }),
    prisma.retailRequest.groupBy({
      by: ["status"],
      where: uiVisibleRetailRequestWhere(),
      _count: { _all: true },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const page = Math.min(pageRequested, pageCount);

  const orderBy: Prisma.RetailRequestFindManyArgs["orderBy"] = {
    [SORTABLE_FIELDS[sortField]]: sortDir,
  };

  const requests = await prisma.retailRequest.findMany({
    where,
    orderBy,
    skip: view === "kanban" ? 0 : (page - 1) * PAGE_SIZE,
    take: view === "kanban" ? 200 : PAGE_SIZE,
    include: {
      lines: {
        orderBy: { id: "asc" },
        take: 3,
        select: {
          productNameAr: true,
          productNameEn: true,
          quantity: true,
        },
      },
      _count: { select: { lines: true } },
    },
  });

  const allCount = statusGroups.reduce((n, g) => n + g._count._all, 0);
  const counts: Record<string, number> = { all: allCount };
  for (const s of RETAIL_REQUEST_STATUSES) {
    counts[s] = statusGroups.find((g) => g.status === s)?._count._all ?? 0;
  }
  counts.waiting = waitingStatuses.reduce((n, s) => n + (counts[s] ?? 0), 0);

  const statusLabelFn = (status: string) =>
    getStatusLabel(dict, "retail", status);

  const tableQs = new URLSearchParams();
  if (tab !== "all") tableQs.set("tab", tab);
  if (q) tableQs.set("q", q);
  const tableHref = tableQs.toString()
    ? `/admin/requests?${tableQs.toString()}`
    : "/admin/requests";

  if (view === "kanban") {
    const kanbanHref = `/admin/requests?${new URLSearchParams({
      ...(tab !== "all" ? { tab } : {}),
      ...(q ? { q } : {}),
      view: "kanban",
    }).toString()}`;
    return (
      <section data-admin-requests="" className="space-y-5 pb-2">
        <header className="rad-phead">
          <div className="flex min-w-0 flex-wrap items-end gap-3">
            <div className="min-w-0">
              <h1>{a.requests}</h1>
              <p>
                <b className="rad-num">{allCount}</b>
                {" · "}
                {u.requestsLead}
              </p>
            </div>
            <div
              className="rad-seg rad-view-toggle"
              role="group"
              aria-label={`${u.viewTable} / ${u.viewKanban}`}
            >
              <Link href={tableHref}>{u.viewTable}</Link>
              <Link href={kanbanHref} className="rad-on" aria-current="page">
                {u.viewKanban}
              </Link>
            </div>
          </div>
        </header>
        <RetailKanbanBoard
          dict={dict}
          cards={requests.map((r) => ({
            id: r.id,
            reference: r.reference,
            customerName: r.customerName,
            status: r.status,
          }))}
        />
      </section>
    );
  }

  const rows: RequestsListRow[] = requests.map((r) => {
    const first = r.lines[0];
    const productLabel = first
      ? locale === "ar"
        ? first.productNameAr || first.productNameEn
        : first.productNameEn || first.productNameAr
      : "—";
    const moreCount = Math.max(0, r._count.lines - 1);
    const onRequest = Number(r.subtotal) <= 0;
    const created = formatAdminListCreated(r.createdAt, locale);
    const money = formatAdminMoneyOrNull(Number(r.subtotal), r.currency, locale);
    return {
      id: r.id,
      reference: r.reference,
      customerName: r.customerName,
      customerPhone:
        formatMaskedPhone(r.customerPhone) || r.customerPhone,
      status: r.status,
      statusLabel: statusLabelFn(r.status),
      pillTone: adminPillToneForStatus("retail", r.status),
      itemCount: r._count.lines,
      productLabel,
      moreCount,
      valueLabel: onRequest ? u.onRequestPrice : money ?? u.onRequestPrice,
      valueOnRequest: onRequest,
      handoffLabel: handoffLabel(u, r.handoffOpenedAt, r.handoffPreparedAt),
      createdLabel: created.primary,
      createdSecondary: created.secondary,
      href: `/admin/requests/${r.id}`,
      fresh: isFresh(r.updatedAt),
    };
  });

  const tabs = [
    { value: "all", label: u.filterAll, count: counts.all },
    { value: "waiting", label: u.filterWaiting, count: counts.waiting },
    ...RETAIL_REQUEST_STATUSES.map((s) => ({
      value: s,
      label: statusLabelFn(s),
      count: counts[s] ?? 0,
    })),
  ];

  return (
    <RequestsListView
      title={a.requests}
      lead={
        <>
          <b className="rad-num">{allCount}</b>
          {" · "}
          {u.requestsLead}
        </>
      }
      tabs={tabs}
      query={{
        tab,
        q,
        page,
        sort: sortField,
        dir: sortDir,
        view: "table",
      }}
      rows={rows}
      totalFiltered={totalFiltered}
      pageCount={pageCount}
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
