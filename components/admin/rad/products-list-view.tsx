"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Boxes, Ellipsis, ImageIcon } from "lucide-react";
import { ProductPublishToggle } from "@/components/admin/product-publish-toggle";
import { ProductThumb } from "@/components/storefront/product-media";
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
import { cn } from "@/lib/utils";

function AdminEmptyThumb({ className }: { className?: string }) {
  return (
    <div className={cn("rad-pt-empty", className)} aria-hidden>
      <ImageIcon width={18} height={18} strokeWidth={1.5} />
    </div>
  );
}

export type ProductsListRow = {
  id: string;
  href: string;
  name: string;
  slug: string;
  categoryName: string;
  statusLabel: string;
  pillTone: PillTone;
  priceLabel: string;
  thumbPath?: string;
  thumbAlt: string;
  published: boolean;
  archived: boolean;
  canPublish: boolean;
  publishDisabledReason: string | null;
};

export type ProductsListTab = {
  value: string;
  label: string;
  count: number;
};

export type ProductsListQuery = {
  tab: string;
  q: string;
  view: "table" | "gallery";
};

function hrefFromQuery(query: ProductsListQuery): string {
  const params = new URLSearchParams();
  if (query.tab && query.tab !== "all") params.set("tab", query.tab);
  if (query.q) params.set("q", query.q);
  if (query.view === "gallery") params.set("view", "gallery");
  const qs = params.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

export function ProductsListView({
  title,
  lead,
  tabs,
  query,
  rows,
  totalFiltered,
  labels,
  locale,
  plateCaption,
}: {
  title: string;
  lead: React.ReactNode;
  tabs: ProductsListTab[];
  query: ProductsListQuery;
  rows: ProductsListRow[];
  totalFiltered: number;
  labels: {
    listAria: string;
    statusFilterAria: string;
    searchLabel: string;
    searchPlaceholder: string;
    colThumb: string;
    colName: string;
    colCategory: string;
    colStatus: string;
    colPrice: string;
    colActions: string;
    viewTable: string;
    viewGallery: string;
    viewToggleAria: string;
    emptyTitle: string;
    emptyBody: string;
    noResultsTitle: string;
    noResultsBody: string;
    clearFilters: string;
    newProduct: string;
    publishNow: string;
    unpublish: string;
    resultsSummary: string;
  };
  locale: string;
  plateCaption: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(query.q);

  const buildHref = useCallback(
    (patch: Partial<ProductsListQuery>) =>
      hrefFromQuery({
        tab: patch.tab ?? query.tab,
        q: patch.q !== undefined ? patch.q : query.q,
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
        router.push(buildHref({ q: search }));
      });
    }, 280);
    return () => window.clearTimeout(t);
  }, [search, query.q, buildHref, router]);

  const filteredEmpty =
    totalFiltered === 0 && (Boolean(query.q) || query.tab !== "all");
  const firstUseEmpty =
    totalFiltered === 0 && !query.q && query.tab === "all";

  const tableHref = buildHref({ view: "table" });
  const galleryHref = buildHref({ view: "gallery" });

  const summary = labels.resultsSummary.replace("{n}", String(totalFiltered));

  const columns: DataTableColumn<ProductsListRow>[] = [
    {
      id: "thumb",
      header: labels.colThumb,
      hideOnMobile: true,
      cell: (r) => (
        <div
          className="w-14 overflow-hidden rounded-[10px] border border-[color:var(--rad-bd)]"
          onClick={(e) => e.stopPropagation()}
        >
          {r.thumbPath ? (
            <ProductThumb
              path={r.thumbPath}
              alt={r.thumbAlt}
              plateCaption={plateCaption}
              className="aspect-square"
            />
          ) : (
            <AdminEmptyThumb className="aspect-square" />
          )}
        </div>
      ),
    },
    {
      id: "name",
      header: labels.colName,
      mobileSlot: "who",
      cell: (r) => (
        <div className="flex items-start gap-3">
          <div className="w-11 shrink-0 overflow-hidden rounded-[10px] border border-[color:var(--rad-bd)] sm:hidden">
            {r.thumbPath ? (
              <ProductThumb
                path={r.thumbPath}
                alt={r.thumbAlt}
                plateCaption={plateCaption}
                className="aspect-square"
              />
            ) : (
              <AdminEmptyThumb className="aspect-square" />
            )}
          </div>
          <div className="rad-who min-w-0">
            <b className="block truncate">{r.name}</b>
            <span
              className="rad-dim rad-mono block truncate"
              style={{ display: "block" }}
            >
              <bdi dir="ltr">{r.slug}</bdi>
            </span>
            <span
              className="rad-dim mt-0.5 block sm:hidden"
              style={{ fontSize: 12 }}
            >
              <span className="block truncate">{r.categoryName}</span>
              <span className="block">
                <bdi dir="ltr">{r.priceLabel}</bdi>
              </span>
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "category",
      header: labels.colCategory,
      hideOnMobile: true,
      cell: (r) => <span className="rad-dim">{r.categoryName}</span>,
    },
    {
      id: "status",
      header: labels.colStatus,
      mobileSlot: "status",
      cell: (r) => (
        <span
          className="inline-flex max-w-full flex-wrap items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Pill tone={r.pillTone}>{r.statusLabel}</Pill>
          {!r.archived ? (
            <span className="hidden sm:inline-flex">
              <ProductPublishToggle
                productId={r.id}
                published={r.published}
                publishLabel={labels.publishNow}
                unpublishLabel={labels.unpublish}
                disabledReason={r.publishDisabledReason}
              />
            </span>
          ) : null}
        </span>
      ),
    },
    {
      id: "price",
      header: labels.colPrice,
      hideOnMobile: true,
      cell: (r) => (
        <span className="rad-num2">
          <bdi dir="ltr">{r.priceLabel}</bdi>
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
      mobileSlot: "acts",
      cell: (r) => (
        <div
          className="flex flex-wrap items-center justify-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {!r.archived ? (
            <span className="sm:hidden">
              <ProductPublishToggle
                productId={r.id}
                published={r.published}
                publishLabel={labels.publishNow}
                unpublishLabel={labels.unpublish}
                disabledReason={r.publishDisabledReason}
              />
            </span>
          ) : null}
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
    <section data-admin-products="" className="space-y-5 pb-2" lang={locale}>
      <header className="rad-phead">
        <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1>{title}</h1>
            <p>{lead}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="rad-seg rad-view-toggle"
              role="group"
              aria-label={labels.viewToggleAria}
            >
              <span className="rad-ind" aria-hidden style={{ width: 0 }} />
              <Link
                href={tableHref}
                className={cn(query.view === "table" && "rad-on")}
                aria-current={query.view === "table" ? "page" : undefined}
              >
                {labels.viewTable}
              </Link>
              <Link
                href={galleryHref}
                className={cn(query.view === "gallery" && "rad-on")}
                aria-current={query.view === "gallery" ? "page" : undefined}
              >
                {labels.viewGallery}
              </Link>
            </div>
            <Link href="/admin/products/new" className="rad-btn rad-pri rad-sm">
              {labels.newProduct}
            </Link>
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
            icon={<Boxes width={26} height={26} strokeWidth={1.5} aria-hidden />}
            action={
              <Link href="/admin/products/new" className="rad-btn rad-gh rad-sm">
                {labels.newProduct}
              </Link>
            }
          />
        ) : filteredEmpty ? (
          <NoResults
            title={labels.noResultsTitle}
            body={labels.noResultsBody}
            icon={<Boxes width={26} height={26} strokeWidth={1.5} aria-hidden />}
            action={
              <Link
                href={buildHref({ tab: "all", q: "" })}
                className="rad-btn rad-gh rad-sm"
              >
                {labels.clearFilters}
              </Link>
            }
          />
        ) : query.view === "gallery" ? (
          <>
            <ul className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:p-5">
              {rows.map((p) => (
                <li key={p.id} className="ro-catalog-tile">
                  <Link href={p.href} className="ro-catalog-tile-media block">
                    {p.thumbPath ? (
                      <ProductThumb
                        path={p.thumbPath}
                        alt={p.thumbAlt}
                        plateCaption={plateCaption}
                        className="aspect-[4/5]"
                      />
                    ) : (
                      <AdminEmptyThumb className="aspect-[4/5] !rounded-none" />
                    )}
                    <span className="absolute start-3 top-3 z-[1]">
                      <Pill tone={p.pillTone}>{p.statusLabel}</Pill>
                    </span>
                    <div className="absolute inset-x-0 bottom-0 z-[1] space-y-1 p-3.5">
                      <p className="font-display text-base font-semibold leading-snug text-[color:#faf6fc] drop-shadow-sm">
                        {p.name}
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-[color:#faf6fc]/90">
                        <bdi dir="ltr">{p.priceLabel}</bdi>
                      </p>
                    </div>
                  </Link>
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <p
                      className="min-w-0 truncate text-[0.7rem] text-[color:var(--rad-tx3)]"
                      dir="ltr"
                    >
                      {p.slug}
                    </p>
                    {!p.archived ? (
                      <ProductPublishToggle
                        productId={p.id}
                        published={p.published}
                        publishLabel={labels.publishNow}
                        unpublishLabel={labels.unpublish}
                        disabledReason={p.publishDisabledReason}
                      />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <div className="rad-pgn">
              <span>{summary}</span>
            </div>
          </>
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
