import Link from "next/link";
import { Suspense } from "react";
import {
  DataTable,
  DataTableHead,
  Td,
  Th,
  Tr,
} from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { AdminTableFilters } from "@/components/admin/table-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { uiVisibleRetailRequestWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import { formatRelative } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { RETAIL_REQUEST_STATUSES } from "@/lib/retail-request/constants";
import { getStatusChipProps } from "@/lib/ui/status-labels";

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

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab: tabRaw, q: qRaw } = await searchParams;
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const requests = await prisma.retailRequest.findMany({
    where: uiVisibleRetailRequestWhere(),
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: { select: { lines: true } },
    },
  });

  const q = qRaw?.trim().toLowerCase() ?? "";
  const tab = tabRaw?.trim() || "all";

  const counts: Record<string, number> = { all: requests.length };
  for (const s of RETAIL_REQUEST_STATUSES) {
    counts[s] = requests.filter((r) => r.status === s).length;
  }

  const filtered = requests.filter((r) => {
    if (tab !== "all" && r.status !== tab) return false;
    if (!q) return true;
    const hay = [r.reference, r.customerName, r.customerPhone]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  const statusLabel = (status: string) =>
    u.status.retail[status] ?? status;

  return (
    <section className="space-y-6">
      <PageHeader title={a.requests} description={u.requestsLead} />
      <Suspense fallback={null}>
        <AdminTableFilters
          tabsLabel={u.filterTabs}
          searchLabel={u.search}
          searchPlaceholder={u.searchPlaceholder}
          tabs={[
            { id: "all", label: u.filterAll, count: counts.all },
            ...RETAIL_REQUEST_STATUSES.map((s) => ({
              id: s,
              label: statusLabel(s),
              count: counts[s] ?? 0,
            })),
          ]}
        />
      </Suspense>
      {filtered.length === 0 ? (
        <div className="border border-ro-line">
          <EmptyState title={u.emptyTitle} body={a.noRequests} />
        </div>
      ) : (
        <DataTable>
          <DataTableHead>
            <Th>{u.colReference}</Th>
            <Th>{u.colCustomer}</Th>
            <Th>{u.colItems}</Th>
            <Th>{a.colStatus}</Th>
            <Th>{u.colHandoff}</Th>
            <Th>{u.colCreated}</Th>
            <Th />
          </DataTableHead>
          <tbody>
            {filtered.map((r) => (
              <Tr key={r.id}>
                <Td className="font-medium">{r.reference}</Td>
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
            ))}
          </tbody>
        </DataTable>
      )}
    </section>
  );
}
