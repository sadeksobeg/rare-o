import Link from "next/link";
import { Suspense } from "react";
import { Boxes, Plus } from "lucide-react";
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
import { ProductThumb } from "@/components/storefront/product-media";
import { StatusChip } from "@/components/ui/status-chip";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PRODUCT_STATUSES } from "@/lib/catalog/constants";
import { listAdminProducts } from "@/lib/catalog/service";
import { formatCurrency } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { isFresh } from "@/lib/ui/fresh";

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
      <PageHeader
        title={a.products}
        icon={<Boxes className="size-5" strokeWidth={2} />}
        action={
          <ButtonLink href="/admin/products/new" variant="primary" size="sm">
            <Plus className="size-3.5" strokeWidth={2.5} aria-hidden />
            {a.newProduct}
          </ButtonLink>
        }
      />

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
        <div className="border border-ro-line">
          <EmptyState title={u.emptyTitle} body={u.emptyBody} />
        </div>
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
          <DataTableHead>
            <Th>{a.colThumb}</Th>
            <Th>{a.colName}</Th>
            <Th>{a.colCategory}</Th>
            <Th>{a.colStatus}</Th>
            <Th>{a.colAvailability}</Th>
            <Th>{a.colPrice}</Th>
            <Th>{a.colSlug}</Th>
            <Th />
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
              return (
                <Tr key={p.id} flash={isFresh(p.updatedAt)}>
                  <Td>
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
                  </Td>
                  <Td>
                    <RowHit href={`/admin/products/${p.id}`}>{name}</RowHit>
                  </Td>
                  <Td className="text-ro-muted">{categoryName}</Td>
                  <Td>
                    <StatusChip
                      tone={productStatusTone(p.status)}
                      label={u.productStatus[p.status] ?? p.status}
                      size="sm"
                    />
                  </Td>
                  <Td>
                    <StatusChip
                      tone={
                        p.availability === "available" ? "success" : "closed"
                      }
                      label={u.availability[p.availability] ?? p.availability}
                      size="sm"
                    />
                  </Td>
                  <Td className="tabular-nums">
                    {formatCurrency(
                      Number(p.retailPrice),
                      p.currency,
                      locale,
                      dict.product.priceOnRequest
                    )}
                  </Td>
                  <Td className="text-ro-muted">{p.slug}</Td>
                  <Td>
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="text-ro-plum hover:underline"
                    >
                      {a.edit}
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
