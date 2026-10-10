import Link from "next/link";
import { listPublishedProducts, listLaunchCategories } from "@/lib/catalog/service";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const { locale, dict } = await getRequestDictionary();
  const [products, categories] = await Promise.all([
    listPublishedProducts({
      categorySlug: params.category,
      q: params.q,
    }),
    listLaunchCategories(),
  ]);

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl">{dict.catalog.title}</h1>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder={locale === "ar" ? "بحث" : "Search"}
            className="border border-ro-line bg-transparent px-3 py-2 text-sm"
          />
          <button type="submit" className="bg-ro-purple px-4 py-2 text-sm text-ro-ivory">
            {dict.catalog.filters}
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/catalog"
          className={!params.category ? "text-ro-purple" : "text-ro-muted"}
        >
          {dict.catalog.allCategories}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/catalog?category=${c.slug}`}
            className={
              params.category === c.slug ? "text-ro-purple" : "text-ro-muted"
            }
          >
            {locale === "ar" ? c.nameAr : c.nameEn}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="text-ro-muted">{dict.catalog.empty}</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const name = locale === "ar" ? p.nameAr || p.nameEn : p.nameEn || p.nameAr;
            return (
              <li key={p.id} className="border border-ro-line p-4">
                <Link href={`/product/${p.slug}`} className="space-y-2">
                  <div className="aspect-[4/3] bg-ro-surface" />
                  <h2 className="text-lg">{name || p.slug}</h2>
                  <p className="text-sm text-ro-muted">
                    {Number(p.retailPrice).toLocaleString(locale)} {p.currency}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
