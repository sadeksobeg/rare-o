import { Tags } from "lucide-react";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { PortalHeroStrip } from "@/components/admin/portal-hero";
import { isProtectedCategorySlug } from "@/lib/catalog/constants";
import { listAdminCategories } from "@/lib/catalog/service";
import { getRequestDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const { locale, dict } = await getRequestDictionary();
  const ar = locale === "ar";
  const categories = await listAdminCategories();
  const totalProducts = categories.reduce((n, c) => n + c._count.products, 0);
  const launch = categories.filter((c) =>
    isProtectedCategorySlug(c.slug)
  ).length;

  return (
    <section data-admin-categories="" className="ro-portal-stagger space-y-5 pb-16">
      <PortalHeroStrip
        eyebrow={ar ? "كتالوج" : "Catalog"}
        title={
          <span className="inline-flex items-center gap-2.5">
            <Tags
              className="size-7 shrink-0 text-[color:var(--ro-accent-fg,var(--ro-plum-800))]"
              strokeWidth={1.5}
            />
            {dict.admin.categories}
          </span>
        }
        subtitle={dict.adminUi.categoriesLead}
        stats={[
          {
            label: ar ? "فئات" : "Categories",
            value: categories.length,
          },
          {
            label: ar ? "منتجات مربوطة" : "Linked products",
            value: totalProducts,
          },
          {
            label: ar ? "فئات الإطلاق" : "Launch set",
            value: launch,
            hint: ar ? "محمية من الحذف" : "Delete-protected",
          },
          {
            label: ar ? "قابلة للترتيب" : "Reorderable",
            value: categories.length,
            hint: ar ? "اسحب البطاقات" : "Drag the cards",
          },
        ]}
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
