import Link from "next/link";
import {
  listPublishedProducts,
  listLaunchCategories,
} from "@/lib/catalog/service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { ProductThumb } from "@/components/storefront/product-media";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/i18n/format";
import { href } from "@/lib/href";

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

  const photoCaption =
    locale === "ar" ? "الصورة قيد التصوير" : "Photography in progress";

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ro-type-overline text-ro-plum">{dict.nav.catalog}</p>
          <h1 className="ro-type-h1 mt-2">{dict.catalog.title}</h1>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder={dict.catalog.search}
            className="h-11 rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 text-sm"
          />
          <button
            type="submit"
            className="h-11 rounded-[var(--ro-r-sm)] bg-ro-ink px-4 text-sm font-semibold text-ro-canvas"
          >
            {dict.catalog.filters}
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href={href("/catalog", locale)}
          className={!params.category ? "text-ro-plum" : "text-ro-muted"}
        >
          {dict.catalog.allCategories}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`${href("/catalog", locale)}?category=${c.slug}`}
            className={
              params.category === c.slug ? "text-ro-plum" : "text-ro-muted"
            }
          >
            {locale === "ar" ? c.nameAr : c.nameEn}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <EmptyState
          title={dict.catalog.empty}
          body={dict.catalog.emptyHint}
          actionHref={href("/", locale)}
          actionLabel={dict.nav.home}
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const name =
              locale === "ar" ? p.nameAr || p.nameEn : p.nameEn || p.nameAr;
            const image = p.images[0];
            const alt =
              locale === "ar"
                ? image?.altAr || name || p.slug
                : image?.altEn || name || p.slug;
            return (
              <li key={p.id}>
                <Link
                  href={href(`/product/${p.slug}`, locale)}
                  className="group block space-y-3"
                >
                  <ProductThumb
                    path={image?.path}
                    alt={alt || p.slug}
                    plateCaption={photoCaption}
                  />
                  <h2 className="text-lg font-semibold transition-colors group-hover:text-ro-plum">
                    {name || p.slug}
                  </h2>
                  <p className="text-sm text-ro-muted tabular-nums">
                    {formatCurrency(
                      Number(p.retailPrice),
                      p.currency,
                      locale,
                      dict.product.priceOnRequest
                    )}
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
