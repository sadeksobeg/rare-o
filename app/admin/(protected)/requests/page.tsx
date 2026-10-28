import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import {
  DataTable,
  DataTableHead,
  RowHit,
  Td,
  Th,
  Tr,
} from "@/components/admin/data-table";
import {
  AdminRecordCard,
  AdminRecordCardList,
} from "@/components/admin/list-record-card";
import { PageHeader } from "@/components/admin/page-header";
import { AdminTableFilters } from "@/components/admin/table-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
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
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const { tab: tabRaw, q: qRaw, page: pageRaw } = await searchParams;
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

  const requests = await prisma.retailRequest.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
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

  const allCount = statusGroups.reduce((n, g) => n + g._count._all, 0);
  const counts: Record<string, number> = { all: allCount };
  for (const s of RETAIL_REQUEST_STATUSES) {
    counts[s] = statusGroups.find((g) => g.status === s)?._count._all ?? 0;
  }

  const statusLabel = (status: string) => u.status.retail[status] ?? status;

  return (
    <section className="space-y-6">
      <PageHeader
        title={a.requests}
        description={u.requestsLead}
        icon={<ShoppingBag className="size-5" strokeWidth={1.5} />}
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
        <div className="border border-ro-line">
          <EmptyState title={u.emptyTitle} body={a.noRequests} />
        </div>
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
              <Th>{u.colReference}</Th>
              <Th>{u.colCustomer}</Th>
              <Th>{u.colItems}</Th>
              <Th>{a.colStatus}</Th>
              <Th>{u.colHandoff}</Th>
              <Th>{u.colLastEvent}</Th>
              <Th>{u.colCreated}</Th>
              <Th />
            </DataTableHead>
            <tbody>
              {requests.map((r) => {
                const last = r.handoffEvents[0];
                return (
                  <Tr key={r.id} flash={isFresh(r.updatedAt)}>
                    <Td>
                      <RowHit href={`/admin/requests/${r.id}`}>
                        {r.reference}
                      </RowHit>
                    </Td>
                    <Td>
                      {r.customerName}
                      <div className="text-ro-muted" dir="ltr">
                        {r.customerPhone}
                      </div>
                    </Td>
                    <Td className="tabular-nums">{r._count.lines}</Td>
                    <Td>
                      <StatusChip
                        size="sm"
                        {...getStatusChipProps(dict, "retail", r.status)}
                      />
                    </Td>
                    <Td>
                      {handoffLabel(u, r.handoffOpenedAt, r.handoffPreparedAt)}
                    </Td>
                    <Td className="text-ro-muted">
                      {last
                        ? formatRelative(last.createdAt, locale)
                        : formatRelative(r.updatedAt, locale)}
                    </Td>
                    <Td className="text-ro-muted">
                      {formatRelative(r.createdAt, locale)}
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/requests/${r.id}`}
                        className="text-ro-plum hover:underline"
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
              <p className="text-ro-muted">
                {totalFiltered} · {page}/{pageCount}
              </p>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={buildPageHref(tab, q, page - 1)}
                    aria-label={dict.common.paginationPrevious}
                    className="inline-flex size-11 items-center justify-center rounded-[var(--ro-r-sm)] border border-ro-line hover:bg-ro-sunken"
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
                    className="inline-flex size-11 items-center justify-center rounded-[var(--ro-r-sm)] border border-ro-line hover:bg-ro-sunken"
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
