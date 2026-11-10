"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Ellipsis, Percent, Plus } from "lucide-react";
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

export type OffersListRow = {
  id: string;
  href: string;
  title: string;
  slug: string;
  statusLabel: string;
  pillTone: PillTone;
  dealRef: string | null;
  updatedLabel: string;
};

export type OffersListTab = {
  value: string;
  label: string;
  count: number;
};

export type OffersListQuery = {
  tab: string;
  q: string;
};

function hrefFromQuery(query: OffersListQuery): string {
  const params = new URLSearchParams();
  if (query.tab && query.tab !== "all") params.set("tab", query.tab);
  if (query.q) params.set("q", query.q);
  const qs = params.toString();
  return qs ? `/admin/offers?${qs}` : "/admin/offers";
}

export function OffersListView({
  title,
  lead,
  tabs,
  query,
  rows,
  totalFiltered,
  labels,
}: {
  title: string;
  lead: React.ReactNode;
  tabs: OffersListTab[];
  query: OffersListQuery;
  rows: OffersListRow[];
  totalFiltered: number;
  labels: {
    listAria: string;
    statusFilterAria: string;
    searchLabel: string;
    searchPlaceholder: string;
    colTitle: string;
    colStatus: string;
    colDeal: string;
    colUpdated: string;
    colActions: string;
    emptyTitle: string;
    emptyBody: string;
    noResultsTitle: string;
    noResultsBody: string;
    clearFilters: string;
    resultsSummary: string;
    newOffer: string;
  };
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(query.q);

  const buildHref = useCallback(
    (patch: Partial<OffersListQuery>) =>
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

  const columns: DataTableColumn<OffersListRow>[] = [
    {
      id: "title",
      header: labels.colTitle,
      mobileSlot: "who",
      cell: (r) => (
        <div className="rad-who">
          <b>{r.title}</b>
          <span className="rad-dim rad-mono" style={{ display: "block" }}>
            <bdi dir="ltr">{r.slug}</bdi>
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: labels.colStatus,
      mobileSlot: "status",
      cell: (r) => <Pill tone={r.pillTone}>{r.statusLabel}</Pill>,
    },
    {
      id: "deal",
      header: labels.colDeal,
      hideOnMobile: true,
      cell: (r) =>
        r.dealRef ? (
          <span className="rad-mono rad-dim">
            <bdi dir="ltr">{r.dealRef}</bdi>
          </span>
        ) : (
          <span className="rad-dim">—</span>
        ),
    },
    {
      id: "updated",
      header: labels.colUpdated,
      hideOnMobile: true,
      cell: (r) => (
        <span className="rad-dim rad-nowrap">{r.updatedLabel}</span>
      ),
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
    <section data-admin-offers="" className="space-y-5 pb-2">
      <header className="rad-phead">
        <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1>{title}</h1>
            <p>{lead}</p>
          </div>
          <Link href="/admin/offers/new" className="rad-btn rad-pri rad-sm whitespace-nowrap">
            <Plus width={16} height={16} strokeWidth={1.5} aria-hidden />
            {labels.newOffer}
          </Link>
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
            icon={<Percent width={26} height={26} strokeWidth={1.5} aria-hidden />}
            action={
              <Link href="/admin/offers/new" className="rad-btn rad-gh rad-sm">
                {labels.newOffer}
              </Link>
            }
          />
        ) : filteredEmpty ? (
          <NoResults
            title={labels.noResultsTitle}
            body={labels.noResultsBody}
            icon={<Percent width={26} height={26} strokeWidth={1.5} aria-hidden />}
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
