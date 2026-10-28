import { Tags } from "lucide-react";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { PageHeader } from "@/components/admin/page-header";
import { isProtectedCategorySlug } from "@/lib/catalog/constants";
import { listAdminCategories } from "@/lib/catalog/service";
import { getRequestDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const { locale, dict } = await getRequestDictionary();
  const categories = await listAdminCategories();

  return (
    <section className="space-y-6">
      <PageHeader
        title={dict.admin.categories}
        description={dict.adminUi.categoriesLead}
        icon={<Tags className="size-5" strokeWidth={2} />}
      />
      <CategoriesManager
        locale={locale}
        dict={dict}
        rows={categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          nameAr: c.nameAr,
          nameEn: c.nameEn,
          sortOrder: c.sortOrder,
          productCount: c._count.products,
          isLaunch: isProtectedCategorySlug(c.slug),
        }))}
      />
    </section>
  );
}
