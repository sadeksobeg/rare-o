import { notFound } from "next/navigation";
import { ImageUploader } from "@/components/admin/image-uploader";
import { ProductForm } from "@/components/admin/product-form";
import {
  Card,
  CardHeader,
  DetailBack,
  DetailHeader,
} from "@/components/ui-kit";
import { oudSpecsFormDefaults, parseOudSpecs } from "@/lib/catalog/oud-specs";
import { getProductById, listAllCategories } from "@/lib/catalog/service";
import { isPromoFeaturesEnabled } from "@/lib/config/feature-flags";
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

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, dict } = await getRequestDictionary();
  const ar = locale === "ar";
  const a = dict.admin;
  const u = dict.adminUi;
  const [product, categories] = await Promise.all([
    getProductById(id),
    listAllCategories(),
  ]);
  if (!product) notFound();

  const displayName =
    locale === "ar"
      ? product.nameAr || product.nameEn || product.slug
      : product.nameEn || product.nameAr || product.slug;
  const categoryName =
    locale === "ar"
      ? product.category.nameAr || product.category.nameEn
      : product.category.nameEn || product.category.nameAr;
  const statusLabel = u.productStatus[product.status] ?? product.status;
  const priceMeta =
    product.retailPrice == null || !product.currency
      ? dict.product.priceOnRequest
      : formatAdminMoney(
          Number(product.retailPrice),
          product.currency,
          locale
        );

  const nav = [
    { href: "#sec-details", label: ar ? "البيانات" : "Details" },
    { href: "#sec-pricing", label: ar ? "التسعير" : "Pricing" },
    { href: "#sec-media", label: ar ? "الوسائط" : "Media" },
  ];

  return (
    <section data-admin-product-detail="" className="pb-8">
      <DetailBack href="/admin/products">{a.products}</DetailBack>

      <DetailHeader
        reference={displayName}
        mono={false}
        status={statusLabel}
        statusTone={productStatusPillTone(product.status)}
        meta={
          <>
            <bdi dir="ltr" className="rad-mono">
              {product.slug}
            </bdi>
            {categoryName ? ` · ${categoryName}` : null}
            {priceMeta ? (
              <>
                {" · "}
                <bdi dir="ltr">{priceMeta}</bdi>
              </>
            ) : null}
          </>
        }
      />

      <div className="rad-peditor mt-5">
        <nav
          className="rad-snav"
          aria-label={ar ? "أقسام المنتج" : "Product sections"}
        >
          {nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="rad-stack min-w-0">
          <Card aria-label={ar ? "بيانات المنتج" : "Product details"}>
            <div className="px-4 py-5 sm:px-5 sm:py-6">
              <ProductForm
                labels={dict.adminUi}
                locale={locale}
                categories={categories}
                showCompareAtPrice={isPromoFeaturesEnabled()}
                imageCount={product.images.length}
                previewImagePath={product.images[0]?.path ?? null}
                product={{
                  id: product.id,
                  slug: product.slug,
                  nameAr: product.nameAr,
                  nameEn: product.nameEn,
                  descriptionAr: product.descriptionAr,
                  descriptionEn: product.descriptionEn,
                  specsTextAr: product.specsTextAr,
                  specsTextEn: product.specsTextEn,
                  categoryId: product.categoryId,
                  retailPrice:
                    product.retailPrice != null
                      ? String(product.retailPrice)
                      : "",
                  compareAtPrice:
                    product.compareAtPrice != null
                      ? String(product.compareAtPrice)
                      : "",
                  currency: product.currency ?? "",
                  status: product.status,
                  availability: product.availability,
                  wholesaleEligible: product.wholesaleEligible,
                  badgeNew: product.badgeNew,
                  badgeFeatured: product.badgeFeatured,
                  badgeSale: product.badgeSale,
                  weightKg:
                    product.weightKg != null ? String(product.weightKg) : "",
                  shippingClass: product.shippingClass ?? "other",
                  oudSpecs: oudSpecsFormDefaults(
                    parseOudSpecs(product.oudSpecs)
                  ),
                }}
              />
            </div>
          </Card>

          <div id="sec-media" className="scroll-mt-28">
            <Card padded={false} aria-label={a.imagesTitle}>
              <CardHeader title={a.imagesTitle} />
              <div className="px-4 pb-5 sm:px-5 sm:pb-6">
                <ImageUploader
                  bare
                  locale={locale}
                  productId={product.id}
                  images={product.images.map((img) => ({
                    id: img.id,
                    path: img.path,
                    altAr: img.altAr,
                    altEn: img.altEn,
                    sortOrder: img.sortOrder,
                    kind: img.kind,
                  }))}
                  dict={dict.admin}
                  translate={{
                    translateSuggest: u.form.translateSuggest,
                    translatePending: u.form.translatePending,
                    translateFailed: u.form.translateFailed,
                  }}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
