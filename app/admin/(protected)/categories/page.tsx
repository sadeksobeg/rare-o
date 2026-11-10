import { CategoriesManager } from "@/components/admin/categories-manager";
import { isProtectedCategorySlug } from "@/lib/catalog/constants";
import { listAdminCategories } from "@/lib/catalog/service";
import { getRequestDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const { locale, dict } = await getRequestDictionary();
  const categories = await listAdminCategories();

  return (
    <section data-admin-categories="" className="space-y-5 pb-2">
      <header className="rad-phead">
        <div>
          <h1>{dict.admin.categories}</h1>
          <p>{dict.adminUi.categoriesLead}</p>
        </div>
      </header>

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
