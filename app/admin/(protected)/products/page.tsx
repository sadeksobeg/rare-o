import Link from "next/link";
import { ProductThumb } from "@/components/storefront/product-media";
import { StatusChip } from "@/components/ui/status-chip";
import { ButtonLink } from "@/components/ui/button";
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

export default async function AdminProductsPage() {
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const products = await listAdminProducts();
  const plateCaption =
    locale === "ar" ? "الصورة قيد التصوير" : "Photography in progress";

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
            {products.map((p) => {
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
                      label={p.status}
                      size="sm"
                    />
                  </td>
                  <td className="p-3">{p.availability}</td>
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
    </section>
  );
}
