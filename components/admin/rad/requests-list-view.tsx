"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { ArrowUpDown, Ellipsis, ShoppingBag } from "lucide-react";
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
import { cn } from "@/lib/utils";

export type RequestsListRow = {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  status: string;
  statusLabel: string;
  pillTone: PillTone;
  itemCount: number;
  productLabel: string;
  moreCount: number;
  valueLabel: string;
  valueOnRequest: boolean;
  handoffLabel: string;
  createdLabel: string;
  createdSecondary: string;
  href: string;
  fresh?: boolean;
};

export type RequestsListTab = {
  value: string;
  label: string;
  count: number;
};

export type RequestsListQuery = {
  tab: string;
  q: string;
  page: number;
  sort: string;
  dir: "asc" | "desc";
  view?: "table" | "kanban";
};

function hrefFromQuery(query: RequestsListQuery): string {
  const params = new URLSearchParams();
  if (query.tab && query.tab !== "all") params.set("tab", query.tab);
  if (query.q) params.set("q", query.q);
  if (query.page > 1) params.set("page", String(query.page));
  if (query.sort !== "created" || query.dir !== "desc") {
    params.set("sort", query.sort);
    params.set("dir", query.dir);
  }
  if (query.view === "kanban") params.set("view", "kanban");
  const qs = params.toString();
  return qs ? `/admin/requests?${qs}` : "/admin/requests";
}

export function RequestsListView({
  title,
  lead,
  tabs,
  query,
  rows,
  totalFiltered,
  pageCount,
  pageSize,
  labels,
  locale,
}: {
  title: string;
  lead: React.ReactNode;
  tabs: RequestsListTab[];
  query: RequestsListQuery;
  rows: RequestsListRow[];
  totalFiltered: number;
  pageCount: number;
  pageSize: number;
  labels: {
    listAria: string;
    statusFilterAria: string;
    searchLabel: string;
    searchPlaceholder: string;
    sortNewest: string;
    sortOldest: string;
    colReference: string;
    colCustomer: string;
    colProducts: string;
    colValue: string;
    colStatus: string;
    colHandoff: string;
    colCreated: string;
    colActions: string;
    moreProducts: string;
    emptyTitle: string;
    emptyBody: string;
    noResultsTitle: string;
    noResultsBody: string;
    clearFilters: string;
    paginationSummary: string;
    paginationPrevious: string;
    paginationNext: string;
    viewTable: string;
    viewKanban: string;
  };
  locale: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(query.q);

  const buildHref = useCallback(
    (patch: Partial<RequestsListQuery>) =>
      hrefFromQuery({
        tab: patch.tab ?? query.tab,
        q: patch.q !== undefined ? patch.q : query.q,
        page: patch.page ?? query.page,
        sort: patch.sort ?? query.sort,
        dir: patch.dir ?? query.dir,
        view: patch.view ?? query.view,
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

  const nextSortDir =
    query.sort === "created" && query.dir === "desc" ? "asc" : "desc";
  const sortHref = buildHref({
    sort: "created",
    dir: nextSortDir,
    page: 1,
  });
  const sortLabel =
    query.sort === "created" && query.dir === "asc"
      ? labels.sortOldest
      : labels.sortNewest;

  const tableHref = buildHref({ view: "table", page: 1 });
  const kanbanHref = buildHref({ view: "kanban", page: 1 });

  const columns: DataTableColumn<RequestsListRow>[] = [
    {
      id: "reference",
      header: labels.colReference,
      mobileSlot: "id",
      cell: (r) => <span className="rad-mono">{r.reference}</span>,
    },
    {
      id: "customer",
      header: labels.colCustomer,
      mobileSlot: "who",
      cell: (r) => (
        <div className="rad-who">
          <Avatar size="sm" gradient={avatarGradient(r.customerName)}>
            {initialOf(r.customerName)}
          </Avatar>
          <div>
            <b>{r.customerName}</b>
            <span>
              <bdi dir="ltr" style={{ unicodeBidi: "isolate" }}>
                {r.customerPhone}
              </bdi>
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "products",
      header: labels.colProducts,
      hideOnMobile: true,
      cell: (r) => (
        <div className="rad-who">
          <span className="rad-pt" style={{ width: 34, height: 34 }}>
            <ShoppingBag width={16} height={16} strokeWidth={1.5} aria-hidden />
          </span>
          <div>
            <b style={{ fontWeight: 500 }}>{r.productLabel}</b>
            {r.moreCount > 0 ? (
              <span>
                {labels.moreProducts.replace("{n}", String(r.moreCount))}
              </span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      id: "value",
      header: labels.colValue,
      hideOnMobile: true,
      cell: (r) => (
        <span
          className="rad-num2"
          style={
            r.valueOnRequest
              ? { color: "var(--rad-tx3)", fontWeight: 500 }
              : undefined
          }
        >
          {r.valueOnRequest ? (
            r.valueLabel
          ) : (
            <bdi dir="ltr">{r.valueLabel}</bdi>
          )}
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
      id: "handoff",
      header: labels.colHandoff,
      hideOnMobile: true,
      cell: (r) => <span className="rad-dim">{r.handoffLabel}</span>,
    },
    {
      id: "created",
      header: labels.colCreated,
      hideOnMobile: true,
      cell: (r) => (
        <span className="rad-dim rad-nowrap">
          {r.createdLabel}
          <br />
          <span className="tabular-nums" style={{ fontSize: 12 }}>
            {r.createdSecondary}
          </span>
        </span>
      ),
    },
    {
      id: "actions",
      header: (
        <span
          className="sr-only"
          style={{ position: "absolute", insetInlineStart: -9999 }}
        >
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
    <section data-admin-requests="" className="space-y-5 pb-2" lang={locale}>
      <header className="rad-phead">
        <div className="flex min-w-0 flex-wrap items-end gap-3">
          <div className="min-w-0">
            <h1>{title}</h1>
            <p>{lead}</p>
          </div>
          <div
            className="rad-seg rad-view-toggle"
            role="group"
            aria-label={`${labels.viewTable} / ${labels.viewKanban}`}
          >
            <span className="rad-ind" aria-hidden style={{ width: 0 }} />
            <Link href={tableHref} className="rad-on" aria-current="page">
              {labels.viewTable}
            </Link>
            <Link href={kanbanHref}>{labels.viewKanban}</Link>
          </div>
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
          endSlot={
            <Link
              href={sortHref}
              className={cn("rad-fch")}
              style={{ borderStyle: "solid", borderColor: "var(--rad-bd)" }}
            >
              <ArrowUpDown width={14} height={14} strokeWidth={1.5} aria-hidden />
              {sortLabel}
            </Link>
          }
        />

        {firstUseEmpty ? (
          <EmptyState
            title={labels.emptyTitle}
            body={labels.emptyBody}
            icon={
              <ShoppingBag width={26} height={26} strokeWidth={1.5} aria-hidden />
            }
          />
        ) : filteredEmpty ? (
          <NoResults
            title={labels.noResultsTitle.replace(
              "{q}",
              query.q || query.tab
            )}
            body={labels.noResultsBody}
            icon={
              <ShoppingBag width={26} height={26} strokeWidth={1.5} aria-hidden />
            }
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

function initialOf(name: string): string {
  const t = name.trim();
  return t ? t[0]! : "?";
}

function avatarGradient(name: string): "" | "g2" | "g3" | "g4" | "g5" {
  const n = name.trim().codePointAt(0) ?? 0;
  const opts = ["", "g2", "g3", "g4", "g5"] as const;
  return opts[n % opts.length]!;
}
