"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Ellipsis, Package } from "lucide-react";
import {
  Avatar,
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  FilterBar,
  NoResults,
  Pagination,
  Pill,
  SegControl,
  type DataTableColumn,
  type PillTone,
} from "@/components/ui-kit";

export type WholesaleListRow = {
  id: string;
  reference: string;
  traderName: string;
  traderEmail: string;
  modeLabel: string;
  statusLabel: string;
  pillTone: PillTone;
  waiting: boolean;
  waitingLabel: string;
  shipping: string;
  lines: number;
  href: string;
};

export type WholesaleListTab = {
  value: string;
  label: string;
  count: number;
};

export type WholesaleListQuery = {
  tab: string;
  q: string;
  page: number;
};

function hrefFromQuery(query: WholesaleListQuery): string {
  const params = new URLSearchParams();
  if (query.tab && query.tab !== "all") params.set("tab", query.tab);
  if (query.q) params.set("q", query.q);
  if (query.page > 1) params.set("page", String(query.page));
  const qs = params.toString();
  return qs ? `/admin/wholesale?${qs}` : "/admin/wholesale";
}

export function WholesaleListView({
  title,
  lead,
  tabs,
  query,
  rows,
  totalFiltered,
  pageCount,
  pageSize,
  labels,
}: {
  title: string;
  lead: React.ReactNode;
  tabs: WholesaleListTab[];
  query: WholesaleListQuery;
  rows: WholesaleListRow[];
  totalFiltered: number;
  pageCount: number;
  pageSize: number;
  labels: {
    listAria: string;
    statusFilterAria: string;
    searchLabel: string;
    searchPlaceholder: string;
    colReference: string;
    colTrader: string;
    colMode: string;
    colStatus: string;
    colShipping: string;
    colLines: string;
    colActions: string;
    emptyTitle: string;
    emptyBody: string;
    noResultsTitle: string;
    noResultsBody: string;
    clearFilters: string;
    paginationSummary: string;
    paginationPrevious: string;
    paginationNext: string;
    tradersHref: string;
    newTrader: string;
  };
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(query.q);

  const buildHref = useCallback(
    (patch: Partial<WholesaleListQuery>) =>
      hrefFromQuery({
        tab: patch.tab ?? query.tab,
        q: patch.q !== undefined ? patch.q : query.q,
        page: patch.page ?? query.page,
      }),
    [query]
  );

  useEffect(() => {
    setSearch(query.q);
  }, [query.q]);

  useEffect(() => {
    if (search === query.q) return;
    const t = window.setTimeout(() => {
      startTransition(() => {
        router.push(buildHref({ q: search, page: 1 }));
      });
    }, 280);
    return () => window.clearTimeout(t);
  }, [search, query.q, buildHref, router]);

  const filteredEmpty =
    totalFiltered === 0 && (Boolean(query.q) || query.tab !== "all");
  const firstUseEmpty =
    totalFiltered === 0 && !query.q && query.tab === "all";

  const from = totalFiltered === 0 ? 0 : (query.page - 1) * pageSize + 1;
  const to =
    totalFiltered === 0
      ? 0
      : Math.min(totalFiltered, (query.page - 1) * pageSize + rows.length);
  const summary = labels.paginationSummary
    .replace("{from}", String(from))
    .replace("{to}", String(to))
    .replace("{total}", String(totalFiltered));

  const columns: DataTableColumn<WholesaleListRow>[] = [
    {
      id: "reference",
      header: labels.colReference,
      mobileSlot: "id",
      cell: (r) => <span className="rad-mono">{r.reference}</span>,
    },
    {
      id: "trader",
      header: labels.colTrader,
      mobileSlot: "who",
      cell: (r) => (
        <div className="rad-who">
          <Avatar size="sm" gradient="g3">
            {r.traderName.trim()[0] || "?"}
          </Avatar>
          <div>
            <b>{r.traderName}</b>
            <span>
              <bdi dir="ltr">{r.traderEmail}</bdi>
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "mode",
      header: labels.colMode,
      hideOnMobile: true,
      cell: (r) => <span className="rad-dim">{r.modeLabel}</span>,
    },
    {
      id: "status",
      header: labels.colStatus,
      mobileSlot: "status",
      cell: (r) => (
        <span className="inline-flex flex-wrap items-center gap-2">
          <Pill tone={r.pillTone}>{r.statusLabel}</Pill>
          {r.waiting ? <Pill tone="warn">{r.waitingLabel}</Pill> : null}
        </span>
      ),
    },
    {
      id: "shipping",
      header: labels.colShipping,
      hideOnMobile: true,
      cell: (r) => (
        <span className="rad-dim">
          <bdi dir="ltr">{r.shipping}</bdi>
        </span>
      ),
    },
    {
      id: "lines",
      header: labels.colLines,
      hideOnMobile: true,
      cell: (r) => <span className="rad-num2">{r.lines}</span>,
    },
    {
      id: "actions",
      header: (
        <span className="sr-only" style={{ position: "absolute", insetInlineStart: -9999 }}>
          {labels.colActions}
        </span>
      ),
      hideOnMobile: true,
      cell: (r) => (
        <Link
          href={r.href}
          className="rad-ib rad-rowact"
          aria-label={labels.colActions}
          onClick={(e) => e.stopPropagation()}
        >
          <Ellipsis width={18} height={18} strokeWidth={1.5} aria-hidden />
        </Link>
      ),
    },
  ];

  return (
    <section data-admin-wholesale="" className="space-y-5 pb-2">
      <header className="rad-phead">
        <div>
          <h1>{title}</h1>
          <p>{lead}</p>
        </div>
      </header>

      <Card padded={false} aria-label={labels.listAria} className="overflow-hidden">
        <CardHeader
          className="!pb-3.5"
          actions={
            <SegControl
              aria-label={labels.statusFilterAria}
              className="w-full max-w-full"
              value={query.tab}
              onChange={(value) => {
                startTransition(() => {
                  router.push(buildHref({ tab: value, page: 1 }));
                });
              }}
              items={tabs.map((t) => ({
                value: t.value,
                label: t.label,
                count: t.count,
              }))}
            />
          }
        />

        <FilterBar
          searchValue={search}
          searchLabel={labels.searchLabel}
          searchPlaceholder={labels.searchPlaceholder}
          onSearchChange={setSearch}
        />

        {firstUseEmpty ? (
          <EmptyState
            title={labels.emptyTitle}
            body={labels.emptyBody}
            icon={<Package width={26} height={26} strokeWidth={1.5} aria-hidden />}
            action={
              <Link href={labels.tradersHref} className="rad-btn rad-gh rad-sm">
                {labels.newTrader}
              </Link>
            }
          />
        ) : filteredEmpty ? (
          <NoResults
            title={labels.noResultsTitle}
            body={labels.noResultsBody}
            icon={<Package width={26} height={26} strokeWidth={1.5} aria-hidden />}
            action={
              <Link
                href={buildHref({ tab: "all", q: "", page: 1 })}
                className="rad-btn rad-gh rad-sm"
              >
                {labels.clearFilters}
              </Link>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                rows={rows}
                getRowId={(r) => r.id}
                onRowClick={(r) => router.push(r.href)}
              />
            </div>
            {pageCount > 1 ? (
              <Pagination
                page={query.page}
                pageCount={pageCount}
                getPageHref={(p) => buildHref({ page: p })}
                summary={summary}
                previousLabel={labels.paginationPrevious}
                nextLabel={labels.paginationNext}
              />
            ) : (
              <div className="rad-pgn">
                <span>{summary}</span>
              </div>
            )}
          </>
        )}
      </Card>
    </section>
  );
}
