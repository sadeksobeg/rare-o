"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Ellipsis, Users } from "lucide-react";
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
} from "@/components/ui-kit";

export type CustomersListRow = {
  id: string;
  name: string;
  phoneMasked: string;
  requestCount: number;
  lastActivity: string;
  lastReference: string | null;
  hasWa: boolean;
  createdLabel: string;
  href: string;
};

export type CustomersListTab = {
  value: string;
  label: string;
  count: number;
};

export type CustomersListQuery = {
  tab: string;
  q: string;
  page: number;
};

function hrefFromQuery(query: CustomersListQuery): string {
  const params = new URLSearchParams();
  if (query.tab && query.tab !== "all") params.set("tab", query.tab);
  if (query.q) params.set("q", query.q);
  if (query.page > 1) params.set("page", String(query.page));
  const qs = params.toString();
  return qs ? `/admin/customers?${qs}` : "/admin/customers";
}

export function CustomersListView({
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
  tabs: CustomersListTab[];
  query: CustomersListQuery;
  rows: CustomersListRow[];
  totalFiltered: number;
  pageCount: number;
  pageSize: number;
  labels: {
    listAria: string;
    statusFilterAria: string;
    searchLabel: string;
    searchPlaceholder: string;
    colName: string;
    colPhone: string;
    colRequests: string;
    colLastActivity: string;
    colWa: string;
    colCreated: string;
    colActions: string;
    emptyTitle: string;
    emptyBody: string;
    noResultsTitle: string;
    noResultsBody: string;
    clearFilters: string;
    paginationSummary: string;
    paginationPrevious: string;
    paginationNext: string;
    requestsHref: string;
    requestsLabel: string;
  };
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(query.q);

  const buildHref = useCallback(
    (patch: Partial<CustomersListQuery>) =>
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

  const columns: DataTableColumn<CustomersListRow>[] = [
    {
      id: "name",
      header: labels.colName,
      mobileSlot: "who",
      cell: (r) => (
        <div className="rad-who">
          <Avatar size="sm">
            {(r.name.trim()[0] || "?").toUpperCase()}
          </Avatar>
          <div>
            <b>{r.name}</b>
          </div>
        </div>
      ),
    },
    {
      id: "phone",
      header: labels.colPhone,
      mobileSlot: "id",
      cell: (r) => (
        <span className="rad-mono">
          <bdi dir="ltr" style={{ unicodeBidi: "isolate" }}>
            {r.phoneMasked}
          </bdi>
        </span>
      ),
    },
    {
      id: "requests",
      header: labels.colRequests,
      hideOnMobile: true,
      cell: (r) => <span className="rad-num2">{r.requestCount}</span>,
    },
    {
      id: "activity",
      header: labels.colLastActivity,
      hideOnMobile: true,
      cell: (r) => (
        <span className="rad-dim">
          {r.lastReference ? (
            <>
              <span style={{ display: "block", fontWeight: 500, color: "var(--rad-tx)" }}>
                {r.lastReference}
              </span>
              {r.lastActivity}
            </>
          ) : (
            "—"
          )}
        </span>
      ),
    },
    {
      id: "wa",
      header: labels.colWa,
      mobileSlot: "status",
      cell: (r) =>
        r.hasWa ? <Pill tone="info">{labels.colWa}</Pill> : <span className="rad-dim">—</span>,
    },
    {
      id: "created",
      header: labels.colCreated,
      hideOnMobile: true,
      cell: (r) => (
        <span className="rad-dim rad-nowrap tabular-nums">{r.createdLabel}</span>
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
    <section data-admin-customers="" className="space-y-5 pb-2">
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
            icon={<Users width={26} height={26} strokeWidth={1.5} aria-hidden />}
            action={
              <Link href={labels.requestsHref} className="rad-btn rad-gh rad-sm">
                {labels.requestsLabel}
              </Link>
            }
          />
        ) : filteredEmpty ? (
          <NoResults
            title={labels.noResultsTitle}
            body={labels.noResultsBody}
            icon={<Users width={26} height={26} strokeWidth={1.5} aria-hidden />}
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
