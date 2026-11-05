import Link from "next/link";
import { Suspense } from "react";
import { Package } from "lucide-react";
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
import { getRequestDictionary } from "@/lib/i18n/server";
import { wholesaleNextActor } from "@/lib/ui/status";
import { isFresh } from "@/lib/ui/fresh";
import { getStatusChipProps } from "@/lib/ui/status-labels";
import { WHOLESALE_STATUSES } from "@/lib/wholesale/constants";
import { listWholesaleRequestsForAdmin } from "@/lib/wholesale/service";

export default async function AdminWholesalePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab: tabRaw, q: qRaw } = await searchParams;
  const { dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const requests = await listWholesaleRequestsForAdmin();
  const q = qRaw?.trim().toLowerCase() ?? "";
  const tab = tabRaw?.trim() || "all";

  const rows = requests.map((r) => ({
    r,
    waiting: wholesaleNextActor(r.status) === "admin",
  }));

  const counts: Record<string, number> = {
    all: rows.length,
    waiting: rows.filter((x) => x.waiting).length,
  };
  for (const s of WHOLESALE_STATUSES) {
    counts[s] = rows.filter((x) => x.r.status === s).length;
  }

  const filtered = rows.filter(({ r, waiting }) => {
    if (tab === "waiting") {
      if (!waiting) return false;
    } else if (tab !== "all" && r.status !== tab) {
      return false;
    }
    if (!q) return true;
    const hay = [r.reference, r.trader.displayName, r.trader.email]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  const statusLabel = (status: string) =>
    u.status.wholesale[status] ??
    dict.trader.wholesaleStatus[status] ??
    status;

  const filteredEmpty = tab !== "all" || Boolean(q);

  return (
    <section data-admin-wholesale="" className="space-y-5 pb-2">
      <PageHeader
        title={a.wholesale}
        description={u.wholesaleLead}
        icon={<Package className="size-5" strokeWidth={1.5} />}
      />
      <Suspense fallback={null}>
        <AdminTableFilters
          tabsLabel={u.filterTabs}
          searchLabel={u.search}
          searchPlaceholder={u.searchWholesale}
          resultCount={filtered.length}
          resultLabel={u.resultsLabel}
          tabs={[
            { id: "all", label: u.filterAll, count: counts.all },
            {
              id: "waiting",
              label: u.filterWaiting,
              count: counts.waiting,
            },
            ...WHOLESALE_STATUSES.map((s) => ({
              id: s,
              label: statusLabel(s),
              count: counts[s] ?? 0,
            })),
          ]}
        />
      </Suspense>
      {filtered.length === 0 ? (
        <EmptyState
          variant={filteredEmpty ? "no-results" : "first-use"}
          title={
            filteredEmpty
              ? u.wholesaleEmptyFilteredTitle
              : u.wholesaleEmptyTitle
          }
          body={
            filteredEmpty
              ? u.wholesaleEmptyFilteredBody
              : u.wholesaleEmptyBody
          }
          actionHref={filteredEmpty ? "/admin/wholesale" : "/admin/traders"}
          actionLabel={filteredEmpty ? dict.catalog.clearFilters : u.newTrader}
        />
      ) : (
        <>
          <AdminRecordCardList>
            {filtered.map(({ r, waiting }) => (
              <AdminRecordCard
                key={r.id}
                href={`/admin/wholesale/${r.id}`}
                flash={isFresh(r.updatedAt)}
                title={r.reference}
                trailing={
                  <StatusChip
                    size="sm"
                    {...getStatusChipProps(dict, "wholesale", r.status)}
                  />
                }
                meta={
                  <>
                    {r.trader.displayName}
                    {waiting ? ` · ${u.waitingOnYou}` : null}
                  </>
                }
                actionLabel={u.actionReview}
              />
            ))}
          </AdminRecordCardList>
          <div className="hidden md:block">
            <DataTable>
              <DataTableHead>
                <Th>{u.colReference}</Th>
                <Th>{u.colTrader}</Th>
                <Th>{u.colMode}</Th>
                <Th>{a.colStatus}</Th>
                <Th>{u.colShipping}</Th>
                <Th>{u.colLines}</Th>
                <Th />
              </DataTableHead>
              <tbody>
                {filtered.map(({ r, waiting }) => {
                  const shipping = [r.carrier, r.trackingReference]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <Tr
                      key={r.id}
                      href={`/admin/wholesale/${r.id}`}
                      flash={isFresh(r.updatedAt)}
                    >
                      <Td>
                        <RowHit href={`/admin/wholesale/${r.id}`}>
                          {r.reference}
                        </RowHit>
                      </Td>
                      <Td>
                        <span className="font-medium text-[color:var(--ro-text)]">
                          {r.trader.displayName}
                        </span>
                        <div
                          className="text-xs text-[color:var(--ro-text-muted)]"
                          dir="ltr"
                        >
                          <bdi>{r.trader.email}</bdi>
                        </div>
                      </Td>
                      <Td>
                        <span className="inline-flex rounded-full border border-[color:var(--ro-border-subtle)] bg-[color:color-mix(in_srgb,var(--ro-text)_6%,transparent)] px-2.5 py-1 text-xs font-medium text-[color:var(--ro-text-2)]">
                          {r.requestMode === "request_quote"
                            ? u.modeRequestQuote
                            : r.requestMode === "propose_price"
                              ? u.modeProposePrice
                              : r.requestMode}
                        </span>
                      </Td>
                      <Td>
                        <span className="flex flex-wrap items-center gap-2">
                          <StatusChip
                            size="sm"
                            {...getStatusChipProps(dict, "wholesale", r.status)}
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
                      <Td
                        className="text-[color:var(--ro-text-muted)]"
                        dir="ltr"
                      >
                        <bdi>{shipping || u.shippingPlaceholder}</bdi>
                      </Td>
                      <Td className="tabular-nums text-[color:var(--ro-text-2)]">
                        {r._count.lines}
                      </Td>
                      <Td>
                        <Link
                          href={`/admin/wholesale/${r.id}`}
                          className="relative z-[2] text-sm font-semibold text-[color:var(--ro-accent-fg,var(--ro-plum-700))] underline-offset-2 hover:underline"
                        >
                          {u.actionReview}
                        </Link>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </DataTable>
          </div>
        </>
      )}
    </section>
  );
}
