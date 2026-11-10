import { ProductForm } from "@/components/admin/product-form";
import { Card, DetailBack, DetailHeader, PayNote } from "@/components/ui-kit";
import { listAllCategories } from "@/lib/catalog/service";
import { isPromoFeaturesEnabled } from "@/lib/config/feature-flags";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function NewProductPage() {
  const { locale, dict } = await getRequestDictionary();
  const categories = await listAllCategories();
  const a = dict.admin;
  const u = dict.adminUi;

  return (
    <section data-admin-product-new="" className="space-y-5 pb-8">
      <DetailBack href="/admin/products">{a.products}</DetailBack>

      <DetailHeader reference={u.detail.newProductTitle} mono={false} />

      <PayNote>{dict.admin.imagesAfterSaveHint}</PayNote>

      <Card aria-label={u.detail.newProductTitle}>
        <div className="px-4 py-5 sm:px-5 sm:py-6">
          <ProductForm
            categories={categories}
            labels={dict.adminUi}
            locale={locale}
            showCompareAtPrice={isPromoFeaturesEnabled()}
          />
        </div>
      </Card>
    </section>
  );
}
