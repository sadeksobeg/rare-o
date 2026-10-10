import {
  countPublishedProducts,
  listLaunchCategories,
  listPublishedProducts,
} from "@/lib/catalog/service";
import {
  CATALOG_MAX_LIMIT,
  CATALOG_PAGE_SIZE,
  isCatalogSort,
} from "@/lib/catalog/constants";
import { getRequestDictionary } from "@/lib/i18n/server";
import { formatNumber } from "@/lib/i18n/format";
import { href } from "@/lib/href";
import { localizedName } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { HandoffExplainer } from "@/components/storefront/handoff-explainer";
import { FilterBar } from "@/components/storefront/catalog/filter-bar";
import { LoadMore } from "@/components/storefront/catalog/load-more";
import { ProductGrid } from "@/components/storefront/catalog/product-grid";

type SearchParams = {
  type?: string;
  /** Legacy alias of `type` (D33). */
  category?: string;
  q?: string;
  min?: string;
  max?: string;
  sort?: string;
  limit?: string;
};

function parsePrice(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { locale, dict } = await getRequestDictionary();
  const categories = await listLaunchCategories();

  // D33: `type` maps to a launch category slug; unknown values are ignored.
  const requestedType = params.type ?? params.category;
  const type = categories.find((c) => c.slug === requestedType)?.slug;
  let min = parsePrice(params.min);
  let max = parsePrice(params.max);
  if (min != null && max != null && min > max) [min, max] = [max, min];
  const sort = isCatalogSort(params.sort) ? params.sort : "new";
  const q = params.q?.trim() || undefined;
  const requestedLimit = Number.parseInt(params.limit ?? "", 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, CATALOG_PAGE_SIZE), CATALOG_MAX_LIMIT)
    : CATALOG_PAGE_SIZE;

  const filters = { categorySlug: type, q, minPrice: min, maxPrice: max };
  const hasFilters = !!(type || q || min != null || max != null);

  const [products, total, totalAll] = await Promise.all([
    listPublishedProducts({ ...filters, sort, limit }),
    countPublishedProducts(filters),
    hasFilters ? countPublishedProducts() : Promise.resolve(-1),
  ]);
  const catalogTotal = hasFilters ? totalAll : total;

  const catalogHref = href("/catalog", locale);
  const nextParams = new URLSearchParams();
  if (type) nextParams.set("type", type);
  if (q) nextParams.set("q", q);
  if (min != null) nextParams.set("min", String(min));
  if (max != null) nextParams.set("max", String(max));
  if (sort !== "new") nextParams.set("sort", sort);
  nextParams.set(
    "limit",
    String(Math.min(limit + CATALOG_PAGE_SIZE, CATALOG_MAX_LIMIT))
  );

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="ro-type-overline text-ro-plum">{dict.nav.catalog}</p>
        <h1 className="ro-type-h1">{dict.catalog.title}</h1>
        <p className="max-w-[60ch] text-ro-text-2">{dict.catalog.lead}</p>
        <p className="text-sm text-ro-muted tabular-nums">
          {formatNumber(total, locale)} {dict.home.pieces}
        </p>
      </header>

      {catalogTotal === 0 ? (
        <EmptyState
          title={dict.catalog.empty}
          body={dict.catalog.emptyHint}
          actionHref={href("/contact", locale)}
          actionLabel={dict.product.contactUs}
        />
      ) : (
        <>
          <FilterBar
            locale={locale}
            labels={dict.catalog}
            piecesLabel={dict.home.pieces}
            basePath={catalogHref}
            categories={categories.map((c) => ({
              slug: c.slug,
              name: localizedName(locale, c.nameAr, c.nameEn, c.slug),
            }))}
            current={{ type, min, max, sort, q }}
            total={total}
          />

          {products.length === 0 ? (
            <EmptyState
              title={dict.catalog.noResults}
              body={dict.catalog.noResultsHint}
              actionHref={catalogHref}
              actionLabel={dict.catalog.clearFilters}
            />
          ) : (
            <>
              <ProductGrid products={products} locale={locale} dict={dict} />
              <LoadMore
                href={`${catalogHref}?${nextParams.toString()}`}
                shown={products.length}
                total={total}
                label={dict.catalog.loadMore}
                progressLabel={dict.catalog.showing
                  .replace("{shown}", formatNumber(products.length, locale))
                  .replace("{total}", formatNumber(total, locale))}
              />
            </>
          )}
        </>
      )}

      <HandoffExplainer dict={dict} compact />
    </div>
  );
}
