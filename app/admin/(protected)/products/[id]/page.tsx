import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getProductById, listLaunchCategories } from "@/lib/catalog/service";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    listLaunchCategories(),
  ]);
  if (!product) notFound();

  return (
    <section className="space-y-6">
      <h1 className="text-3xl">Edit product</h1>
      <ProductForm
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
