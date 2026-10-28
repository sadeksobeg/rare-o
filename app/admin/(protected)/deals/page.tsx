import Link from "next/link";
import { Suspense } from "react";
import { Handshake } from "lucide-react";
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
import { DEAL_STATUSES } from "@/lib/deals/constants";
import { listDealsForAdmin } from "@/lib/deals/service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { dealNextActor } from "@/lib/ui/status";
import { isFresh } from "@/lib/ui/fresh";
import { getStatusChipProps } from "@/lib/ui/status-labels";

export default async function AdminDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab: tabRaw, q: qRaw } = await searchParams;
  const { dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const deals = await listDealsForAdmin();
  const q = qRaw?.trim().toLowerCase() ?? "";

  const rows = deals.map((d) => {
    const last = (d.entries[0]?.actorRole ?? null) as "trader" | "admin" | null;
    const waiting = dealNextActor(d.status, last) === "admin";
    return { d, waiting, last };
  });

  const counts: Record<string, number> = {
    all: rows.length,
    waiting: rows.filter((r) => r.waiting).length,
  };
  for (const s of DEAL_STATUSES) {
    counts[s] = rows.filter((r) => r.d.status === s).length;
  }

  const tab = tabRaw?.trim() || "all";
  const filtered = rows.filter(({ d, waiting }) => {
    if (tab === "waiting") {
      if (!waiting) return false;
    } else if (tab !== "all" && d.status !== tab) {
      return false;
    }
    if (!q) return true;
    const hay = [
      d.reference,
      d.title,
      d.trader.displayName,
      d.trader.email,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  const statusLabel = (status: string) =>
    u.status.deal[status] ??
    dict.trader.dealStatus[status] ??
    status;

  return (
    <section className="space-y-6">
      <PageHeader
        title={a.deals}
        description={u.dealsLead}
        icon={<Handshake className="size-5" strokeWidth={2} />}
      />
      <Suspense fallback={null}>
        <AdminTableFilters
          tabsLabel={u.filterTabs}
          searchLabel={u.search}
          searchPlaceholder={u.searchDeals}
          resultCount={filtered.length}
          resultLabel={u.resultsLabel}
          tabs={[
            { id: "all", label: u.filterAll, count: counts.all },
            {
              id: "waiting",
              label: u.filterWaiting,
              count: counts.waiting,
            },
            ...DEAL_STATUSES.map((s) => ({
              id: s,
              label: statusLabel(s),
              count: counts[s] ?? 0,
            })),
          ]}
        />
      </Suspense>
      {filtered.length === 0 ? (
        <div className="border border-ro-line">
          <EmptyState title={u.emptyTitle} body={u.emptyBody} />
        </div>
      ) : (
        <>
          <AdminRecordCardList>
            {filtered.map(({ d, waiting }) => (
              <AdminRecordCard
                key={d.id}
                href={`/admin/deals/${d.id}`}
                flash={isFresh(d.updatedAt)}
                title={d.reference}
                trailing={
                  <StatusChip
                    size="sm"
                    {...getStatusChipProps(dict, "deal", d.status)}
                  />
                }
                meta={
                  <>
                    {d.trader.displayName}
                    {waiting ? ` · ${u.waitingOnYou}` : null}
                  </>
                }
                actionLabel={u.actionNegotiate}
              />
            ))}
          </AdminRecordCardList>
          <div className="hidden md:block">
        <DataTable>
          <DataTableHead>
            <Th>{u.colReference}</Th>
            <Th>{u.colTrader}</Th>
            <Th>{u.colTitle}</Th>
            <Th>{u.colKind}</Th>
            <Th>{a.colStatus}</Th>
            <Th>{u.colEntries}</Th>
            <Th />
          </DataTableHead>
          <tbody>
            {filtered.map(({ d, waiting }) => (
              <Tr key={d.id} flash={isFresh(d.updatedAt)}>
                <Td>
                  <RowHit href={`/admin/deals/${d.id}`}>{d.reference}</RowHit>
                </Td>
                <Td>
                  {d.trader.displayName}
                  <div className="text-ro-muted" dir="ltr">
                    {d.trader.email}
                  </div>
                </Td>
                <Td>{d.title}</Td>
                <Td>
                  {d.dealKind === "catalog"
                    ? u.kindCatalog
                    : d.dealKind === "non_catalog"
                      ? u.kindNonCatalog
                      : d.dealKind}
                </Td>
                <Td>
                  <span className="flex flex-wrap items-center gap-2">
                    <StatusChip
                      size="sm"
                      {...getStatusChipProps(dict, "deal", d.status)}
                    />
                    {waiting ? (
                      <StatusChip
                        size="sm"
                        tone="attention"
                        label={u.waitingOnYou}
                      />
                    ) : null}
                  </span>
                </Td>
                <Td className="tabular-nums">{d._count.entries}</Td>
                <Td>
                  <Link
                    href={`/admin/deals/${d.id}`}
                    className="text-ro-plum hover:underline"
                  >
                    {u.actionNegotiate}
                  </Link>
                </Td>
              </Tr>
            ))}
          </tbody>
        </DataTable>
          </div>
        </>
      )}
    </section>
  );
}
