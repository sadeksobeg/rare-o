import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { listLaunchCategories } from "@/lib/catalog/service";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function NewProductPage() {
  const { locale, dict } = await getRequestDictionary();
  const categories = await listLaunchCategories();
  return (
    <section className="space-y-6">
      <PageHeader title={dict.adminUi.detail.newProductTitle} />
      <ProductForm
        categories={categories}
        labels={dict.adminUi}
        locale={locale}
      />
    </section>
  );
}
