"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Ellipsis, Store } from "lucide-react";
import {
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  FilterBar,
  NoResults,
  Pill,
  SegControl,
  type DataTableColumn,
  type PillTone,
} from "@/components/ui-kit";

export type TradersListRow = {
  id: string;
  href: string;
  name: string;
  companyName: string | null;
  email: string;
  statusLabel: string;
  pillTone: PillTone;
  deals: number;
  wholesale: number;
  brokerage: number;
  interests: string;
  actions: React.ReactNode;
};

export type TradersListTab = {
  value: string;
  label: string;
  count: number;
};

export type TradersListQuery = {
  tab: string;
  q: string;
};

function hrefFromQuery(query: TradersListQuery): string {
  const params = new URLSearchParams();
  if (query.tab && query.tab !== "all") params.set("tab", query.tab);
  if (query.q) params.set("q", query.q);
  const qs = params.toString();
  return qs ? `/admin/traders?${qs}` : "/admin/traders";
}

export function TradersListView({
  title,
  lead,
  tabs,
  query,
  rows,
  totalFiltered,
  labels,
  headerAction,
}: {
  title: string;
  lead: React.ReactNode;
  tabs: TradersListTab[];
  query: TradersListQuery;
  rows: TradersListRow[];
  totalFiltered: number;
  headerAction?: React.ReactNode;
  labels: {
    listAria: string;
    statusFilterAria: string;
    searchLabel: string;
    searchPlaceholder: string;
    colName: string;
    colEmail: string;
    colStatus: string;
    colDeals: string;
    colWholesale: string;
    colBrokerage: string;
    colActions: string;
    emptyTitle: string;
    emptyBody: string;
    noResultsTitle: string;
    noResultsBody: string;
    clearFilters: string;
    resultsSummary: string;
  };
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(query.q);

  const buildHref = useCallback(
    (patch: Partial<TradersListQuery>) =>
      hrefFromQuery({
        tab: patch.tab ?? query.tab,
        q: patch.q !== undefined ? patch.q : query.q,
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
        router.push(buildHref({ q: search }));
      });
    }, 280);
    return () => window.clearTimeout(t);
  }, [search, query.q, buildHref, router]);

  const filteredEmpty =
    totalFiltered === 0 && (Boolean(query.q) || query.tab !== "all");
  const firstUseEmpty =
    totalFiltered === 0 && !query.q && query.tab === "all";
  const summary = labels.resultsSummary.replace("{n}", String(totalFiltered));

  const columns: DataTableColumn<TradersListRow>[] = [
    {
      id: "name",
      header: labels.colName,
      mobileSlot: "who",
      cell: (r) => (
        <div className="rad-who min-w-0">
          <b>{r.name}</b>
          {r.companyName ? (
            <span className="rad-dim" style={{ display: "block" }}>
              {r.companyName}
            </span>
          ) : null}
          <span
            className="rad-dim mt-0.5 block sm:hidden"
            style={{ fontSize: 12 }}
          >
            <bdi dir="ltr">{r.email}</bdi>
          </span>
          <span
            className="rad-dim mt-0.5 block sm:hidden"
            style={{ fontSize: 12 }}
          >
            {labels.colDeals} {r.deals}
            {" · "}
            {labels.colWholesale} {r.wholesale}
            {" · "}
            {labels.colBrokerage} {r.brokerage}
          </span>
          {r.interests ? (
            <span className="rad-dim" style={{ display: "block", fontSize: 11 }}>
              {r.interests}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "email",
      header: labels.colEmail,
      hideOnMobile: true,
      cell: (r) => (
        <span className="rad-dim">
          <bdi dir="ltr">{r.email}</bdi>
        </span>
      ),
    },
    {
      id: "status",
      header: labels.colStatus,
      mobileSlot: "status",
      cell: (r) => <Pill tone={r.pillTone}>{r.statusLabel}</Pill>,
    },
    {
      id: "deals",
      header: labels.colDeals,
      hideOnMobile: true,
      cell: (r) => <span className="rad-num2">{r.deals}</span>,
    },
    {
      id: "wholesale",
      header: labels.colWholesale,
      hideOnMobile: true,
      cell: (r) => <span className="rad-num2">{r.wholesale}</span>,
    },
    {
      id: "brokerage",
      header: labels.colBrokerage,
      hideOnMobile: true,
      cell: (r) => <span className="rad-num2">{r.brokerage}</span>,
    },
    {
      id: "actions",
      header: (
        <span className="sr-only" style={{ position: "absolute", insetInlineStart: -9999 }}>
          {labels.colActions}
        </span>
      ),
      mobileSlot: "acts",
      cell: (r) => (
        <div
          className="flex flex-wrap items-center justify-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {r.actions}
          <Link
            href={r.href}
            className="rad-ib rad-rowact"
            aria-label={labels.colActions}
          >
            <Ellipsis width={18} height={18} strokeWidth={1.5} aria-hidden />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <section data-admin-traders="" className="space-y-5 pb-2">
      <header className="rad-phead">
        <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1>{title}</h1>
            <p>{lead}</p>
          </div>
          {headerAction}
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
                  router.push(buildHref({ tab: value }));
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
            icon={<Store width={26} height={26} strokeWidth={1.5} aria-hidden />}
          />
        ) : filteredEmpty ? (
          <NoResults
            title={labels.noResultsTitle}
            body={labels.noResultsBody}
            icon={<Store width={26} height={26} strokeWidth={1.5} aria-hidden />}
            action={
              <Link href={buildHref({ tab: "all", q: "" })} className="rad-btn rad-gh rad-sm">
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
            <div className="rad-pgn">
              <span>{summary}</span>
            </div>
          </>
        )}
      </Card>
    </section>
  );
}
