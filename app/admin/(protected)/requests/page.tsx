import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import {
  DataTable,
  DataTableHead,
  RowHit,
  SortableTh,
  Td,
  Th,
  Tr,
} from "@/components/admin/data-table";
import {
  AdminRecordCard,
  AdminRecordCardList,
} from "@/components/admin/list-record-card";
import { PageHeader } from "@/components/admin/page-header";
import { RetailKanbanBoard } from "@/components/admin/retail-kanban";
import { AdminTableFilters } from "@/components/admin/table-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/utils";
import { uiVisibleRetailRequestWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import { containsCI } from "@/lib/db/search";
import { formatRelative } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import {
  RETAIL_REQUEST_STATUSES,
  isRetailRequestStatus,
} from "@/lib/retail-request/constants";
import { statusesAwaitingAdmin } from "@/lib/ui/status";
import { isFresh } from "@/lib/ui/fresh";
import { getStatusChipProps } from "@/lib/ui/status-labels";
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
  const sortField = isSortField(sortRaw) ? sortRaw : undefined;
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

  const orderBy: Prisma.RetailRequestFindManyArgs["orderBy"] = sortField
    ? { [SORTABLE_FIELDS[sortField]]: sortDir }
    : { updatedAt: "desc" };

  const requests = await prisma.retailRequest.findMany({
    where,
    orderBy,
    skip: view === "kanban" ? 0 : (page - 1) * PAGE_SIZE,
    take: view === "kanban" ? 200 : PAGE_SIZE,
    include: {
      _count: { select: { lines: true } },
      handoffEvents: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          createdAt: true,
          eventType: true,
          actor: true,
        },
      },
    },
  });

  function sortHref(field: SortField) {
    const nextDir = sortField === field && sortDir === "desc" ? "asc" : "desc";
    const params = new URLSearchParams();
    if (tab !== "all") params.set("tab", tab);
    if (q) params.set("q", q);
    if (view !== "table") params.set("view", view);
    params.set("sort", field);
    params.set("dir", nextDir);
    return `/admin/requests?${params.toString()}`;
  }

  const allCount = statusGroups.reduce((n, g) => n + g._count._all, 0);
  const counts: Record<string, number> = { all: allCount };
  for (const s of RETAIL_REQUEST_STATUSES) {
    counts[s] = statusGroups.find((g) => g.status === s)?._count._all ?? 0;
  }

  const statusLabel = (status: string) => u.status.retail[status] ?? status;

  const viewQs = `${tab !== "all" ? `&tab=${encodeURIComponent(tab)}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <section data-admin-requests="" className="ro-portal-stagger space-y-5 pb-2">
      <PageHeader
        title={a.requests}
        description={u.requestsLead}
        icon={<ShoppingBag className="size-5" strokeWidth={1.5} />}
        action={
          <div
            className="inline-flex items-center gap-1 rounded-[12px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-sunken)] p-1"
            role="group"
            aria-label={`${u.viewTable} / ${u.viewKanban}`}
          >
            <Link
              href={`/admin/requests?view=table${viewQs}`}
              className={cn(
                "inline-flex h-9 items-center rounded-[10px] px-3.5 text-sm font-semibold transition-[background-color,color] duration-[var(--ro-dur-fast)]",
                view === "table"
                  ? "bg-[color:var(--ro-plum-700)] text-[var(--ro-sand-50)] shadow-[0_1px_0_color-mix(in_srgb,var(--ro-sand-50)_18%,transparent)_inset]"
                  : "text-[color:var(--ro-text-2)] hover:bg-[color:var(--ro-panel-hover)] hover:text-[color:var(--ro-text)]"
              )}
            >
              {u.viewTable}
            </Link>
            <Link
              href={`/admin/requests?view=kanban${viewQs}`}
              className={cn(
                "inline-flex h-9 items-center rounded-[10px] px-3.5 text-sm font-semibold transition-[background-color,color] duration-[var(--ro-dur-fast)]",
                view === "kanban"
                  ? "bg-[color:var(--ro-plum-700)] text-[var(--ro-sand-50)] shadow-[0_1px_0_color-mix(in_srgb,var(--ro-sand-50)_18%,transparent)_inset]"
                  : "text-[color:var(--ro-text-2)] hover:bg-[color:var(--ro-panel-hover)] hover:text-[color:var(--ro-text)]"
              )}
            >
              {u.viewKanban}
            </Link>
          </div>
        }
      />
      <Suspense fallback={null}>
        <AdminTableFilters
          tabsLabel={u.filterTabs}
          searchLabel={u.search}
          searchPlaceholder={u.searchRequests}
          resultCount={totalFiltered}
          resultLabel={u.resultsLabel}
          tabs={[
            { id: "all", label: u.filterAll, count: counts.all },
            {
              id: "waiting",
              label: u.filterWaiting,
              count: waitingStatuses.reduce((n, s) => n + (counts[s] ?? 0), 0),
            },
            ...RETAIL_REQUEST_STATUSES.map((s) => ({
              id: s,
              label: statusLabel(s),
              count: counts[s] ?? 0,
            })),
          ]}
        />
      </Suspense>
      {requests.length === 0 ? (
        <EmptyState
          variant={tab !== "all" || q ? "no-results" : "first-use"}
          title={u.emptyTitle}
          body={a.noRequests}
          actionHref={
            tab !== "all" || q ? "/admin/requests" : "/admin/products/new"
          }
          actionLabel={
            tab !== "all" || q ? dict.catalog.clearFilters : a.newProduct
          }
        />
      ) : view === "kanban" ? (
        <RetailKanbanBoard
          dict={dict}
          cards={requests.map((r) => ({
            id: r.id,
            reference: r.reference,
            customerName: r.customerName,
            status: r.status,
          }))}
        />
      ) : (
        <>
          <AdminRecordCardList>
            {requests.map((r) => (
              <AdminRecordCard
                key={r.id}
                href={`/admin/requests/${r.id}`}
                flash={isFresh(r.updatedAt)}
                title={r.reference}
                trailing={
                  <StatusChip
                    size="sm"
                    {...getStatusChipProps(dict, "retail", r.status)}
                  />
                }
                meta={
                  <>
                    {r.customerName}
                    <span className="ms-2" dir="ltr">
                      {r.customerPhone}
                    </span>
                  </>
                }
                actionLabel={u.actionView}
              />
            ))}
          </AdminRecordCardList>
          <div className="hidden md:block">
          <DataTable>
            <DataTableHead>
              <SortableTh
                href={sortHref("reference")}
                active={sortField === "reference"}
                direction={sortField === "reference" ? sortDir : undefined}
              >
                {u.colReference}
              </SortableTh>
              <Th>{u.colCustomer}</Th>
              <Th>{u.colItems}</Th>
              <SortableTh
                href={sortHref("status")}
                active={sortField === "status"}
                direction={sortField === "status" ? sortDir : undefined}
              >
                {a.colStatus}
              </SortableTh>
              <Th>{u.colHandoff}</Th>
              <Th>{u.colLastEvent}</Th>
              <SortableTh
                href={sortHref("created")}
                active={sortField === "created"}
                direction={sortField === "created" ? sortDir : undefined}
              >
                {u.colCreated}
              </SortableTh>
              <Th />
            </DataTableHead>
            <tbody>
              {requests.map((r) => {
                const last = r.handoffEvents[0];
                return (
                  <Tr
                    key={r.id}
                    href={`/admin/requests/${r.id}`}
                    flash={isFresh(r.updatedAt)}
                  >
                    <Td>
                      <RowHit href={`/admin/requests/${r.id}`}>
                        {r.reference}
                      </RowHit>
                    </Td>
                    <Td>
                      <span className="font-medium text-[color:var(--ro-text)]">
                        {r.customerName}
                      </span>
                      <div
                        className="text-xs text-[color:var(--ro-text-muted)]"
                        dir="ltr"
                      >
                        <bdi>{r.customerPhone}</bdi>
                      </div>
                    </Td>
                    <Td className="tabular-nums text-[color:var(--ro-text-2)]">
                      {r._count.lines}
                    </Td>
                    <Td>
                      <StatusChip
                        size="sm"
                        {...getStatusChipProps(dict, "retail", r.status)}
                      />
                    </Td>
                    <Td>
                      <span className="inline-flex rounded-full border border-[color:var(--ro-border-subtle)] bg-[color:color-mix(in_srgb,var(--ro-text)_6%,transparent)] px-2.5 py-1 text-xs font-medium text-[color:var(--ro-text-2)]">
                        {handoffLabel(u, r.handoffOpenedAt, r.handoffPreparedAt)}
                      </span>
                    </Td>
                    <Td className="text-[color:var(--ro-text-muted)]">
                      {last
                        ? formatRelative(last.createdAt, locale)
                        : formatRelative(r.updatedAt, locale)}
                    </Td>
                    <Td className="text-[color:var(--ro-text-muted)]">
                      {formatRelative(r.createdAt, locale)}
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/requests/${r.id}`}
                        className="relative z-[2] text-sm font-semibold text-[color:var(--ro-accent-fg,var(--ro-plum-700))] underline-offset-2 hover:underline"
                      >
                        {u.actionView}
                      </Link>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </DataTable>
          </div>
          {pageCount > 1 ? (
            <nav
              aria-label="Pagination"
              className="flex flex-wrap items-center justify-between gap-3 text-sm"
            >
              <p className="text-[color:var(--ro-text-muted)]">
                {totalFiltered} · {page}/{pageCount}
              </p>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={buildPageHref(tab, q, page - 1)}
                    aria-label={dict.common.paginationPrevious}
                    className="inline-flex size-11 items-center justify-center rounded-[12px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel)] text-[color:var(--ro-text)] hover:bg-[color:var(--ro-panel-hover)]"
                  >
                    <ChevronLeft
                      className="size-4 rtl:-scale-x-100"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </Link>
                ) : null}
                {page < pageCount ? (
                  <Link
                    href={buildPageHref(tab, q, page + 1)}
                    aria-label={dict.common.paginationNext}
                    className="inline-flex size-11 items-center justify-center rounded-[12px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel)] text-[color:var(--ro-text)] hover:bg-[color:var(--ro-panel-hover)]"
                  >
                    <ChevronRight
                      className="size-4 rtl:-scale-x-100"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </Link>
                ) : null}
              </div>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}

function buildPageHref(tab: string, q: string, page: number) {
  const params = new URLSearchParams();
  if (tab && tab !== "all") params.set("tab", tab);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/requests?${qs}` : "/admin/requests";
}
