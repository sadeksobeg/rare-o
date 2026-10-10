import { updateCategoryFormAction } from "@/app/actions";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { listLaunchCategories } from "@/lib/catalog/service";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function AdminCategoriesPage() {
  const { dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const categories = await listLaunchCategories();

  return (
    <section className="space-y-6">
      <PageHeader title={a.categories} description={u.categoriesLead} />
      <ul className="space-y-4">
        {categories.map((c) => (
          <li key={c.id} className="border border-ro-line bg-ro-surface p-4">
            <p className="mb-3 text-xs tracking-wide text-ro-plum" dir="ltr">
              {c.slug}
            </p>
            <form
              action={updateCategoryFormAction}
              className="grid gap-3 md:grid-cols-3"
            >
              <input type="hidden" name="id" value={c.id} />
              <TextField
                id={`${c.id}-nameAr`}
                name="nameAr"
                label={u.categoryNameAr}
                defaultValue={c.nameAr}
                dir="rtl"
                dense
              />
              <TextField
                id={`${c.id}-nameEn`}
                name="nameEn"
                label={u.categoryNameEn}
                defaultValue={c.nameEn}
                dir="ltr"
                dense
              />
              <TextField
                id={`${c.id}-sortOrder`}
                name="sortOrder"
                type="number"
                label={u.categorySortOrder}
                defaultValue={String(c.sortOrder)}
                dense
              />
              <Button type="submit" size="sm" className="md:col-span-3 md:w-fit">
                {u.categorySave}
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
