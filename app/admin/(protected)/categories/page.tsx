import { updateCategoryFormAction } from "@/app/actions";
import { listLaunchCategories } from "@/lib/catalog/service";

export default async function AdminCategoriesPage() {
  const categories = await listLaunchCategories();

  return (
    <section className="space-y-6">
      <h1 className="text-3xl">Categories</h1>
      <p className="text-sm text-ro-muted">
        Launch set only (String Musical Instruments, Accessories). Labels and
        order can be edited. Creating additional categories is not available in
        Week 2.
      </p>
      <ul className="space-y-6">
        {categories.map((c) => (
          <li key={c.id} className="border border-ro-line p-4">
            <p className="mb-3 text-xs tracking-wide text-ro-purple">{c.slug}</p>
            <form action={updateCategoryFormAction} className="grid gap-3 md:grid-cols-3">
              <input type="hidden" name="id" value={c.id} />
              <label className="text-sm">
                Name AR
                <input
                  name="nameAr"
                  defaultValue={c.nameAr}
                  className="mt-1 w-full border border-ro-line bg-transparent px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Name EN
                <input
                  name="nameEn"
                  defaultValue={c.nameEn}
                  className="mt-1 w-full border border-ro-line bg-transparent px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Sort order
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={c.sortOrder}
                  className="mt-1 w-full border border-ro-line bg-transparent px-3 py-2"
                />
              </label>
              <button
                type="submit"
                className="bg-ro-purple px-4 py-2 text-sm text-ro-ivory md:col-span-3 md:w-fit"
              >
                Save labels
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
