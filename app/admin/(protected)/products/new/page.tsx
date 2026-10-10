import { ProductForm } from "@/components/admin/product-form";
import { listLaunchCategories } from "@/lib/catalog/service";

export default async function NewProductPage() {
  const categories = await listLaunchCategories();
  return (
    <section className="space-y-6">
      <h1 className="text-3xl">New product</h1>
      <ProductForm categories={categories} />
    </section>
  );
}
