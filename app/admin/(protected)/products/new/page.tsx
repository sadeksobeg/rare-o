import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { Banner } from "@/components/ui/banner";
import { listAllCategories } from "@/lib/catalog/service";
import { isPromoFeaturesEnabled } from "@/lib/config/feature-flags";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function NewProductPage() {
  const { locale, dict } = await getRequestDictionary();
  const categories = await listAllCategories();
  return (
    <section className="space-y-6">
      <PageHeader
        title={dict.adminUi.detail.newProductTitle}
        icon={<Plus className="size-5" strokeWidth={2} />}
      />
      <Banner tone="info">{dict.admin.imagesAfterSaveHint}</Banner>
      <ProductForm
        categories={categories}
        labels={dict.adminUi}
        locale={locale}
        showCompareAtPrice={isPromoFeaturesEnabled()}
      />
    </section>
  );
}
