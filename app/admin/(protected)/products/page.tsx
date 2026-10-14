import Link from "next/link";
import { Suspense } from "react";
import { AdminTableFilters } from "@/components/admin/table-filters";
import { ProductThumb } from "@/components/storefront/product-media";
import { StatusChip } from "@/components/ui/status-chip";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PRODUCT_STATUSES } from "@/lib/catalog/constants";
import { listAdminProducts } from "@/lib/catalog/service";
import { formatCurrency } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";

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
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab: tabRaw, q: qRaw } = await searchParams;
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const products = await listAdminProducts();
  const plateCaption =
    locale === "ar" ? "الصورة قيد التصوير" : "Photography in progress";
  const q = qRaw?.trim().toLowerCase() ?? "";
  const tab = tabRaw?.trim() || "all";

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

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
          {a.products}
        </h1>
        <ButtonLink href="/admin/products/new" variant="primary" size="sm">
          {a.newProduct}
        </ButtonLink>
      </div>

      <Suspense fallback={null}>
        <AdminTableFilters
          tabsLabel={u.filterTabs}
          searchLabel={u.search}
          searchPlaceholder={u.searchPlaceholder}
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
        <div className="border border-ro-line">
          <EmptyState title={u.emptyTitle} body={u.emptyBody} />
        </div>
      ) : (
        <div className="overflow-x-auto border border-ro-line">
          <table className="min-w-full text-start text-sm">
            <thead className="border-b border-ro-line bg-ro-surface">
              <tr>
                <th className="p-3 font-medium">{a.colThumb}</th>
                <th className="p-3 font-medium">{a.colName}</th>
                <th className="p-3 font-medium">{a.colCategory}</th>
                <th className="p-3 font-medium">{a.colStatus}</th>
                <th className="p-3 font-medium">{a.colAvailability}</th>
                <th className="p-3 font-medium">{a.colPrice}</th>
                <th className="p-3 font-medium">{a.colSlug}</th>
                <th className="p-3" />
              </tr>
            </thead>
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
                return (
                  <tr key={p.id} className="border-b border-ro-line">
                    <td className="p-3">
                      <div className="w-14">
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
                    </td>
                    <td className="p-3 font-medium">{name}</td>
                    <td className="p-3 text-ro-muted">{categoryName}</td>
                    <td className="p-3">
                      <StatusChip
                        tone={productStatusTone(p.status)}
                        label={u.productStatus[p.status] ?? p.status}
                        size="sm"
                      />
                    </td>
                    <td className="p-3">
                      <StatusChip
                        tone={
                          p.availability === "available" ? "success" : "closed"
                        }
                        label={
                          u.availability[p.availability] ?? p.availability
                        }
                        size="sm"
                      />
                    </td>
                    <td className="p-3 tabular-nums">
                      {formatCurrency(
                        Number(p.retailPrice),
                        p.currency,
                        locale,
                        dict.product.priceOnRequest
                      )}
                    </td>
                    <td className="p-3 text-ro-muted">{p.slug}</td>
                    <td className="p-3">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-ro-plum hover:underline"
                      >
                        {a.edit}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
