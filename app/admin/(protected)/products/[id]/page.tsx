import { Boxes } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ImageUploader } from "@/components/admin/image-uploader";
import { ProductForm } from "@/components/admin/product-form";
import { oudSpecsFormDefaults, parseOudSpecs } from "@/lib/catalog/oud-specs";
import { getProductById, listAllCategories } from "@/lib/catalog/service";
import { isPromoFeaturesEnabled } from "@/lib/config/feature-flags";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, dict } = await getRequestDictionary();
  const [product, categories] = await Promise.all([
    getProductById(id),
    listAllCategories(),
  ]);
  if (!product) notFound();

  return (
    <section className="space-y-8">
      <PageHeader
        title={`${dict.admin.edit}: ${product.nameAr || product.nameEn || product.slug}`}
        icon={<Boxes className="size-5" strokeWidth={2} />}
      />

      <ImageUploader
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
      />

      <ProductForm
        labels={dict.adminUi}
        locale={locale}
        categories={categories}
        showCompareAtPrice={isPromoFeaturesEnabled()}
        imageCount={product.images.length}
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
            product.retailPrice != null ? String(product.retailPrice) : "",
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
          oudSpecs: oudSpecsFormDefaults(parseOudSpecs(product.oudSpecs)),
        }}
      />
    </section>
  );
}
