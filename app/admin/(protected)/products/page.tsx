import {
  ProductsListView,
  type ProductsListRow,
} from "@/components/admin/rad/products-list-view";
import { PRODUCT_STATUSES } from "@/lib/catalog/constants";
import { listAdminProducts } from "@/lib/catalog/service";
import { formatAdminMoney } from "@/lib/i18n/admin-format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import type { StatusTone } from "@/lib/ui/status";

function productStatusPillTone(status: string) {
  const tone: StatusTone =
    status === "published"
      ? "success"
      : status === "archived"
        ? "closed"
        : status === "draft"
          ? "neutral"
          : "info";
  return statusToneToPill(tone);
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

  const listRows: ProductsListRow[] = filtered.map((p) => {
    const thumb = p.images[0];
    const name =
      locale === "ar"
        ? p.nameAr || p.nameEn || "—"
        : p.nameEn || p.nameAr || "—";
    const categoryName =
      locale === "ar"
        ? p.category.nameAr || p.category.nameEn
        : p.category.nameEn || p.category.nameAr;
    const canPublish = Boolean(p.nameAr?.trim()) && p.images.length > 0;
    const publishDisabledReason = canPublish
      ? null
      : !p.nameAr?.trim()
        ? u.form.publishNeedsNameAr
        : u.form.publishNeedsImage;

    return {
      id: p.id,
      href: `/admin/products/${p.id}`,
      name,
      slug: p.slug,
      categoryName: categoryName ?? "—",
      statusLabel: u.productStatus[p.status] ?? p.status,
      pillTone: productStatusPillTone(p.status),
      priceLabel:
        p.retailPrice == null || !p.currency
          ? dict.product.priceOnRequest
          : formatAdminMoney(Number(p.retailPrice), p.currency, locale),
      thumbPath: thumb?.path,
      thumbAlt:
        locale === "ar" ? thumb?.altAr || name : thumb?.altEn || name,
      published: p.status === "published",
      archived: p.status === "archived",
      canPublish,
      publishDisabledReason,
    };
  });

  const lead = ar
    ? "من المسودة إلى النشر — معرض فاخر وجدول تشغيل واضح لكل قطعة"
    : "From draft to publish — a luxury gallery and a clear ops table for every piece";

  const resultsSummary = ar
    ? "{n} نتيجة"
    : "{n} results";

  return (
    <ProductsListView
      title={a.products}
      lead={lead}
      tabs={[
        { value: "all", label: u.filterAll, count: counts.all },
        ...PRODUCT_STATUSES.map((s) => ({
          value: s,
          label: u.productStatus[s] ?? s,
          count: counts[s] ?? 0,
        })),
      ]}
      query={{ tab, q: qRaw?.trim() ?? "", view }}
      rows={listRows}
      totalFiltered={filtered.length}
      labels={{
        listAria: a.products,
        statusFilterAria: u.filterTabs,
        searchLabel: u.search,
        searchPlaceholder: u.searchProducts,
        colThumb: a.colThumb,
        colName: a.colName,
        colCategory: a.colCategory,
        colStatus: a.colStatus,
        colPrice: a.colPrice,
        colActions: a.edit,
        viewTable: u.viewTable,
        viewGallery: u.viewGallery,
        viewToggleAria: ar ? "طريقة العرض" : "View mode",
        emptyTitle: u.emptyTitle,
        emptyBody: u.emptyBody,
        noResultsTitle: u.emptyTitle,
        noResultsBody: u.emptyBody,
        clearFilters: dict.catalog.clearFilters,
        newProduct: a.newProduct,
        publishNow: u.publishNow,
        unpublish: u.unpublish,
        resultsSummary,
      }}
      locale={locale}
      plateCaption={plateCaption}
    />
  );
}
