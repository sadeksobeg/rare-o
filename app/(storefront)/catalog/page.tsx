import type { Metadata } from "next";
import {
  countPublishedProducts,
  getCatalogFacets,
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
import { storefrontMetadata, withDefaultOgImage } from "@/lib/seo";
import { EmptyState } from "@/components/ui/empty-state";
import { HandoffExplainer } from "@/components/storefront/handoff-explainer";
import {
  CatalogFilters,
  CatalogToolbar,
} from "@/components/storefront/catalog/catalog-filters";
import { parseBadges } from "@/lib/catalog/badges";
import { LoadMore } from "@/components/storefront/catalog/load-more";
import { ProductGrid } from "@/components/storefront/catalog/product-grid";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getRequestDictionary();
  return withDefaultOgImage(
    storefrontMetadata({
      locale,
      title: `${dict.catalog.title} — ${dict.brand}`,
      description: dict.seo.catalogDescription || dict.catalog.lead,
      path: "/catalog",
    })
  );
}

type SearchParams = {
  type?: string;
  /** Legacy alias of `type` (D33). */
  category?: string;
  q?: string;
  min?: string;
  max?: string;
  sort?: string;
  limit?: string;
  avail?: string;
  flags?: string;
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

  const availableOnly = params.avail === "1";
  const badges = parseBadges(params.flags);
  const filters = {
    categorySlug: type,
    q,
    minPrice: min,
    maxPrice: max,
    availableOnly,
    badges,
  };
  const hasFilters = !!(
    type ||
    q ||
    min != null ||
    max != null ||
    availableOnly ||
    badges.length
  );

  const [products, total, totalAll, facets] = await Promise.all([
    listPublishedProducts({ ...filters, sort, limit }),
    countPublishedProducts(filters),
    hasFilters ? countPublishedProducts() : Promise.resolve(-1),
    getCatalogFacets(filters),
  ]);
  const catalogTotal = hasFilters ? totalAll : total;

  const catalogHref = href("/catalog", locale);
  const nextParams = new URLSearchParams();
  if (type) nextParams.set("type", type);
  if (q) nextParams.set("q", q);
  if (min != null) nextParams.set("min", String(min));
  if (max != null) nextParams.set("max", String(max));
  if (availableOnly) nextParams.set("avail", "1");
  if (badges.length) nextParams.set("flags", badges.join(","));
  if (sort !== "new") nextParams.set("sort", sort);
  nextParams.set(
    "limit",
    String(Math.min(limit + CATALOG_PAGE_SIZE, CATALOG_MAX_LIMIT))
  );

  const facetCategories = categories.map((c) => ({
    slug: c.slug,
    name: localizedName(locale, c.nameAr, c.nameEn, c.slug),
    count: facets.categoryCounts[c.slug] ?? 0,
  }));
  const currentValues = {
    type,
    min,
    max,
    sort,
    q,
    availableOnly,
    badges,
  };

  return (
    <div className="space-y-8 md:space-y-10">
      <header className="max-w-3xl space-y-2 pt-2">
        <h1 className="ro-type-h1 md:text-5xl">{dict.catalog.title}</h1>
        <p className="max-w-[56ch] text-ro-text-2 md:text-lg">
          {dict.catalog.lead}
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
        <div className="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
          <CatalogFilters
            locale={locale}
            basePath={catalogHref}
            categories={facetCategories}
            current={currentValues}
            bounds={facets.price}
            availableCount={facets.availableCount}
            badgeCounts={facets.badgeCounts}
            total={total}
          />
          <section className="min-w-0 space-y-5" aria-label={dict.catalog.title}>
            <CatalogToolbar
              locale={locale}
              basePath={catalogHref}
              categories={facetCategories}
              current={currentValues}
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
                <ProductGrid
                  products={products}
                  locale={locale}
                  dict={dict}
                  className="lg:grid-cols-2 xl:grid-cols-3"
                />
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
          </section>
        </div>
      )}

      <HandoffExplainer dict={dict} compact />
    </div>
  );
}
