import { notFound } from "next/navigation";
import { ImageUploader } from "@/components/admin/image-uploader";
import { ProductForm } from "@/components/admin/product-form";
import { getProductById, listLaunchCategories } from "@/lib/catalog/service";
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
    listLaunchCategories(),
  ]);
  if (!product) notFound();

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
        {dict.admin.edit}:{" "}
        {product.nameAr || product.nameEn || product.slug}
      </h1>

      <ImageUploader
        productId={product.id}
        images={product.images.map((img) => ({
          id: img.id,
          path: img.path,
          altAr: img.altAr,
          altEn: img.altEn,
          sortOrder: img.sortOrder,
        }))}
        dict={dict.admin}
      />

      <ProductForm
        labels={dict.adminUi}
        locale={locale}
        categories={categories}
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
          retailPrice: String(product.retailPrice),
          currency: product.currency,
          status: product.status,
          availability: product.availability,
          wholesaleEligible: product.wholesaleEligible,
        }}
      />
    </section>
  );
}
