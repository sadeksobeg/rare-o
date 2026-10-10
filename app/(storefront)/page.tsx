import { HomepageShell } from "@/components/storefront/discovery/homepage-shell";
import { DiscoveryShortcuts } from "@/components/storefront/discovery/discovery-shortcuts";
import { CategoryExplorer } from "@/components/storefront/discovery/category-explorer";
import { FeaturedInstrument } from "@/components/storefront/discovery/featured-instrument";
import { DiscoveryMosaic } from "@/components/storefront/discovery/discovery-mosaic";
import {
  OffersRail,
  ProductsRail,
} from "@/components/storefront/discovery/discovery-rail";
import { AttributeExplorer } from "@/components/storefront/discovery/attribute-explorer";
import { HomeHero } from "@/components/storefront/home/hero";
import { HomeBrandIntro } from "@/components/storefront/home/brand-intro";
import { HomeOudEditorial } from "@/components/storefront/home/oud-editorial";
import { HomePrinciples } from "@/components/storefront/home/principles";
import { HomeFinalCta } from "@/components/storefront/home/final-cta";
import { StorefrontFooter } from "@/components/storefront/footer";
import { getHomepageDiscoveryData } from "@/lib/catalog/homepage";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function HomePage() {
  const { locale, dict } = await getRequestDictionary();
  const data = await getHomepageDiscoveryData();

  const mosaicProducts =
    data.mosaic.length > 0 ? data.mosaic : data.products;
  const latestRail = data.latest.filter(
    (p) => p.id !== data.featuredInstrument?.id
  );
  const secondary = data.secondaryRail.filter(
    (p) =>
      p.id !== data.featuredInstrument?.id &&
      !latestRail.slice(0, 4).some((x) => x.id === p.id)
  );

  return (
    <HomepageShell dict={dict} locale={locale} data={data}>
      <div data-page="home">
        <HomeHero dict={dict} locale={locale} product={data.heroProduct} />

        <DiscoveryShortcuts
          dict={dict}
          hasAvailable={data.available.length > 0}
          hasOffers={data.offers.length > 0}
          hasProducts={data.products.length > 0}
        />

        <HomeBrandIntro dict={dict} />

        <CategoryExplorer
          dict={dict}
          locale={locale}
          categories={data.categories}
        />

        {data.featuredInstrument ? (
          <FeaturedInstrument
            dict={dict}
            locale={locale}
            product={data.featuredInstrument}
          />
        ) : null}

        <DiscoveryMosaic
          dict={dict}
          locale={locale}
          products={mosaicProducts}
        />

        {data.offers.length > 0 ? (
          <OffersRail dict={dict} locale={locale} offers={data.offers} />
        ) : (
          <ProductsRail
            dict={dict}
            locale={locale}
            products={latestRail}
            eyebrow={dict.home.latestRailEyebrow}
            title={dict.home.latestRailTitle}
            id="latest"
            tone="cream"
          />
        )}

        <AttributeExplorer
          dict={dict}
          locale={locale}
          products={data.products}
          categories={data.categories}
        />

        <HomeOudEditorial dict={dict} />

        {data.offers.length > 0 ? (
          <ProductsRail
            dict={dict}
            locale={locale}
            products={latestRail}
            eyebrow={dict.home.latestRailEyebrow}
            title={dict.home.latestRailTitle}
            id="latest"
            tone="surface"
          />
        ) : null}

        {secondary.length > 0 ? (
          <ProductsRail
            dict={dict}
            locale={locale}
            products={secondary}
            eyebrow={dict.home.secondaryRailEyebrow}
            title={dict.home.secondaryRailTitle}
            tone="cream"
          />
        ) : null}

        <HomePrinciples dict={dict} />
        <HomeFinalCta dict={dict} />
        <StorefrontFooter dict={dict} />
      </div>
    </HomepageShell>
  );
}
