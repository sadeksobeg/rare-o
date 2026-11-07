import Link from "next/link";
import { Suspense } from "react";
import { Boxes, LayoutGrid, List, Plus } from "lucide-react";
import {
  CellLink,
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
import { PortalHeroStrip } from "@/components/admin/portal-hero";
import { ProductPublishToggle } from "@/components/admin/product-publish-toggle";
import { AdminTableFilters } from "@/components/admin/table-filters";
import { ProductThumb } from "@/components/storefront/product-media";
import { StatusChip } from "@/components/ui/status-chip";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PRODUCT_STATUSES } from "@/lib/catalog/constants";
import { listAdminProducts } from "@/lib/catalog/service";
import { formatCurrency } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { isFresh } from "@/lib/ui/fresh";
import { cn } from "@/lib/utils";

function productStatusTone(
  status: string
): "neutral" | "info" | "success" | "closed" {
  if (status === "published") return "success";
  if (status === "archived") return "closed";
  if (status === "draft") return "neutral";
  return "info";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; view?: string }>;
}) {
  const { tab: tabRaw, q: qRaw, view: viewRaw } = await searchParams;
  const { locale, dict } = await getRequestDictionary();
  const ar = locale === "ar";
  const a = dict.admin;
  const u = dict.adminUi;
  const products = await listAdminProducts();
  const plateCaption = dict.catalog.photoCaption;
  const q = qRaw?.trim().toLowerCase() ?? "";
  const tab = tabRaw?.trim() || "all";
  const view = viewRaw === "gallery" ? "gallery" : "table";

  const counts: Record<string, number> = { all: products.length };
  for (const s of PRODUCT_STATUSES) {
    counts[s] = products.filter((p) => p.status === s).length;
  }

  const filtered = products.filter((p) => {
    if (tab !== "all" && p.status !== tab) return false;
    if (!q) return true;
    const nameAr = p.nameAr || "";
    const nameEn = p.nameEn || "";
    const hay = [p.slug, nameAr, nameEn, p.category.nameAr, p.category.nameEn]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  const available = products.filter((p) => p.availability === "available")
    .length;

  const viewQs = (next: "table" | "gallery") => {
    const params = new URLSearchParams();
    params.set("view", next);
    if (tab !== "all") params.set("tab", tab);
    if (q) params.set("q", q);
    return `/admin/products?${params.toString()}`;
  };

  return (
    <section data-admin-products="" className="ro-portal-stagger space-y-5 pb-16">
      <PortalHeroStrip
        eyebrow={ar ? "كتالوج" : "Catalog"}
        title={
          <span className="inline-flex items-center gap-2.5">
            <Boxes
              className="size-7 shrink-0 text-[color:var(--ro-accent-fg,var(--ro-plum-800))]"
              strokeWidth={1.5}
            />
            {a.products}
          </span>
        }
        subtitle={
          ar
            ? "من المسودة إلى النشر — معرض فاخر وجدول تشغيل واضح لكل قطعة"
            : "From draft to publish — a luxury gallery and a clear ops table for every piece"
        }
        actions={
          <ButtonLink href="/admin/products/new" variant="primary" size="sm">
            <Plus className="size-3.5" strokeWidth={1.5} aria-hidden />
            {a.newProduct}
          </ButtonLink>
        }
        stats={[
          {
            label: ar ? "الكل" : "Total",
            value: counts.all,
            hint: ar ? "في الكتالوج" : "In catalog",
          },
          {
            label: u.productStatus.published ?? (ar ? "منشور" : "Published"),
            value: counts.published ?? 0,
          },
          {
            label: u.productStatus.draft ?? (ar ? "مسودة" : "Draft"),
            value: counts.draft ?? 0,
          },
          {
            label: ar ? "متوفر" : "Available",
            value: available,
            hint: ar ? "جاهز للطلب" : "Ready to sell",
          },
        ]}
      />

      <div
        role="tablist"
        aria-label={ar ? "طريقة العرض" : "View mode"}
        className="ro-portal-tablist inline-flex max-w-full"
      >
        <Link
          href={viewQs("table")}
          role="tab"
          aria-selected={view === "table"}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 px-3 text-sm transition-[color,background-color,box-shadow,transform] duration-[var(--ro-dur-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
            view === "table"
              ? "font-semibold text-[color:var(--ro-text)]"
              : "text-[color:var(--ro-text-2)] hover:text-[color:var(--ro-text)]"
          )}
        >
          <List className="size-3.5" strokeWidth={1.5} aria-hidden />
          {u.viewTable}
        </Link>
        <Link
          href={viewQs("gallery")}
          role="tab"
          aria-selected={view === "gallery"}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 px-3 text-sm transition-[color,background-color,box-shadow,transform] duration-[var(--ro-dur-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
            view === "gallery"
              ? "font-semibold text-[color:var(--ro-text)]"
              : "text-[color:var(--ro-text-2)] hover:text-[color:var(--ro-text)]"
          )}
        >
          <LayoutGrid className="size-3.5" strokeWidth={1.5} aria-hidden />
          {u.viewGallery}
        </Link>
      </div>

      <Suspense fallback={null}>
        <AdminTableFilters
          tabsLabel={u.filterTabs}
          searchLabel={u.search}
          searchPlaceholder={u.searchProducts}
          resultCount={filtered.length}
          resultLabel={u.resultsLabel}
          tabs={[
            { id: "all", label: u.filterAll, count: counts.all },
            ...PRODUCT_STATUSES.map((s) => ({
              id: s,
              label: u.productStatus[s] ?? s,
              count: counts[s] ?? 0,
            })),
          ]}
        />
      </Suspense>

      {filtered.length === 0 ? (
        <EmptyState
          variant={tab !== "all" || q ? "no-results" : "first-use"}
          title={u.emptyTitle}
          body={u.emptyBody}
          actionHref={
            tab !== "all" || q ? "/admin/products" : "/admin/products/new"
          }
          actionLabel={
            tab !== "all" || q ? dict.catalog.clearFilters : a.newProduct
          }
        />
      ) : view === "gallery" ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const thumb = p.images[0];
            const name =
              locale === "ar"
                ? p.nameAr || p.nameEn || "—"
                : p.nameEn || p.nameAr || "—";
            const canPublish =
              Boolean(p.nameAr?.trim()) && p.images.length > 0;
            return (
              <li
                key={p.id}
                className={cn(
                  "ro-catalog-tile",
                  isFresh(p.updatedAt) && "ro-s10-flash"
                )}
              >
                <Link
                  href={`/admin/products/${p.id}`}
                  className="ro-catalog-tile-media block"
                >
                  <ProductThumb
                    path={thumb?.path}
                    alt={
                      locale === "ar"
                        ? thumb?.altAr || name
                        : thumb?.altEn || name
                    }
                    plateCaption={plateCaption}
                    className="aspect-[4/5]"
                  />
                  <span className="absolute start-3 top-3 z-[1]">
                    <StatusChip
                      tone={productStatusTone(p.status)}
                      label={u.productStatus[p.status] ?? p.status}
                      size="sm"
                    />
                  </span>
                  <div className="absolute inset-x-0 bottom-0 z-[1] space-y-1 p-3.5">
                    <p className="font-display text-base font-semibold leading-snug text-[color:#faf6fc] drop-shadow-sm">
                      {name}
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-[color:#faf6fc]/90]">
                      {formatCurrency(
                        Number(p.retailPrice),
                        p.currency,
                        locale,
                        dict.product.priceOnRequest
                      )}
                    </p>
                  </div>
                </Link>
                <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p
                      className="truncate text-[0.7rem] text-[color:var(--ro-text-muted)]"
                      dir="ltr"
                    >
                      {p.slug}
                    </p>
                    <StatusChip
                      tone={
                        p.availability === "available" ? "success" : "closed"
                      }
                      label={u.availability[p.availability] ?? p.availability}
                      size="sm"
                      className="mt-1.5"
                    />
                  </div>
                  {p.status !== "archived" ? (
                    <ProductPublishToggle
                      productId={p.id}
                      published={p.status === "published"}
                      publishLabel={u.publishNow}
                      unpublishLabel={u.unpublish}
                      disabledReason={
                        canPublish
                          ? null
                          : !p.nameAr?.trim()
                            ? u.form.publishNeedsNameAr
                            : u.form.publishNeedsImage
                      }
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          <AdminRecordCardList>
            {filtered.map((p) => {
              const name =
                locale === "ar"
                  ? p.nameAr || p.nameEn || "—"
                  : p.nameEn || p.nameAr || "—";
              return (
                <AdminRecordCard
                  key={p.id}
                  href={`/admin/products/${p.id}`}
                  flash={isFresh(p.updatedAt)}
                  title={name}
                  trailing={
                    <StatusChip
                      tone={productStatusTone(p.status)}
                      label={u.productStatus[p.status] ?? p.status}
                      size="sm"
                    />
                  }
                  meta={p.slug}
                  actionLabel={a.edit}
                />
              );
            })}
          </AdminRecordCardList>
          <div className="hidden md:block">
            <DataTable>
              <colgroup>
                <col style={{ width: "5.5rem" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "16%" }} />
              </colgroup>
              <DataTableHead>
                <Th>{a.colThumb}</Th>
                <Th>{a.colName}</Th>
                <Th>{a.colCategory}</Th>
                <Th>{a.colStatus}</Th>
                <Th>{a.colAvailability}</Th>
                <Th>{a.colPrice}</Th>
                <Th>{a.colSlug}</Th>
              </DataTableHead>
              <tbody>
                {filtered.map((p) => {
                  const thumb = p.images[0];
                  const name =
                    locale === "ar"
                      ? p.nameAr || p.nameEn || "—"
                      : p.nameEn || p.nameAr || "—";
                  const categoryName =
                    locale === "ar"
                      ? p.category.nameAr || p.category.nameEn
                      : p.category.nameEn || p.category.nameAr;
                  const canPublish =
                    Boolean(p.nameAr?.trim()) && p.images.length > 0;
                  return (
                    <Tr
                      key={p.id}
                      href={`/admin/products/${p.id}`}
                      flash={isFresh(p.updatedAt)}
                    >
                      <Td>
                        <CellLink href={`/admin/products/${p.id}`}>
                          <div className="w-14 overflow-hidden rounded-[10px] border border-[color:var(--ro-border-subtle)]">
                            <ProductThumb
                              path={thumb?.path}
                              alt={
                                locale === "ar"
                                  ? thumb?.altAr || name
                                  : thumb?.altEn || name
                              }
                              plateCaption={plateCaption}
                              className="aspect-square"
                            />
                          </div>
                        </CellLink>
                      </Td>
                      <Td>
                        <RowHit href={`/admin/products/${p.id}`}>{name}</RowHit>
                      </Td>
                      <Td className="text-[color:var(--ro-text-2)]">
                        <CellLink
                          href={`/admin/products/${p.id}`}
                          className="text-[color:var(--ro-text-2)]"
                        >
                          {categoryName}
                        </CellLink>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusChip
                            tone={productStatusTone(p.status)}
                            label={u.productStatus[p.status] ?? p.status}
                            size="sm"
                          />
                          {p.status !== "archived" ? (
                            <ProductPublishToggle
                              productId={p.id}
                              published={p.status === "published"}
                              publishLabel={u.publishNow}
                              unpublishLabel={u.unpublish}
                              disabledReason={
                                canPublish
                                  ? null
                                  : !p.nameAr?.trim()
                                    ? u.form.publishNeedsNameAr
                                    : u.form.publishNeedsImage
                              }
                            />
                          ) : null}
                        </div>
                      </Td>
                      <Td>
                        <CellLink href={`/admin/products/${p.id}`}>
                          <StatusChip
                            tone={
                              p.availability === "available"
                                ? "success"
                                : "closed"
                            }
                            label={
                              u.availability[p.availability] ?? p.availability
                            }
                            size="sm"
                          />
                        </CellLink>
                      </Td>
                      <Td className="font-semibold tabular-nums text-[color:var(--ro-text)]">
                        <CellLink
                          href={`/admin/products/${p.id}`}
                          className="font-semibold tabular-nums text-[color:var(--ro-text)]"
                        >
                          {formatCurrency(
                            Number(p.retailPrice),
                            p.currency,
                            locale,
                            dict.product.priceOnRequest
                          )}
                        </CellLink>
                      </Td>
                      <Td>
                        <CellLink href={`/admin/products/${p.id}`}>
                          <span
                            className="text-xs text-[color:var(--ro-text-muted)]"
                            dir="ltr"
                          >
                            {p.slug}
                          </span>
                        </CellLink>
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
