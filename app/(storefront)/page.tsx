import type { Metadata } from "next";
import { storefrontMetadata } from "@/lib/seo";
import { HomepageShell } from "@/components/storefront/discovery/homepage-shell";
import { CategoryExplorer } from "@/components/storefront/discovery/category-explorer";
import { FeaturedInstrument } from "@/components/storefront/discovery/featured-instrument";
import { HeroResonance } from "@/components/storefront/home/hero-resonance";
import { ShortcutStrip } from "@/components/storefront/home/shortcut-strip";
import { SectionHeader } from "@/components/storefront/home/section-header";
import { PromoBands } from "@/components/storefront/home/promo-bands";
import { FeaturedOfferModule } from "@/components/storefront/home/featured-offer";
import { HomeOudEditorial } from "@/components/storefront/home/oud-editorial";
import { HomeHandoff } from "@/components/storefront/home/home-handoff";
import { TraderBand } from "@/components/storefront/trader-band";
import { ProductGrid } from "@/components/storefront/catalog/product-grid";
import { getHomepageDiscoveryData } from "@/lib/catalog/homepage";
import { getRequestDictionary } from "@/lib/i18n/server";
import { listActivePromoBands } from "@/lib/promos/service";
import { href } from "@/lib/href";
import { localizedName } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getRequestDictionary();
  return storefrontMetadata({
    locale,
    title: `${dict.brand} — ${dict.home.headline}`,
    description: dict.home.sub,
    path: "/",
  });
}

/**
 * Ordered commerce home:
 * 1 Hero → 2 Shortcuts → 3 Spotlight → 4 Shop grid → 5 Categories → 6 Accessories → 7 Utility
 */
export default async function HomePage() {
  const { locale, dict } = await getRequestDictionary();
  const [data, promoBands] = await Promise.all([
    getHomepageDiscoveryData(),
    listActivePromoBands(),
  ]);

  const featuredId = data.featuredInstrument?.id;
  const shop = data.latest
    .filter((p) => p.id !== featuredId)
    .slice(0, 8);
  const shopFallback =
    shop.length > 0 ? shop : data.latest.slice(0, 8);

  const accessories = data.byCategory["accessories"].slice(0, 4);
  const featuredOffer = data.offers[0] ?? null;

  return (
    <HomepageShell dict={dict} locale={locale} data={data}>
      <div data-page="home" data-skin="commerce-ordered">
        <HeroResonance dict={dict} locale={locale} />
        <ShortcutStrip
          dict={dict}
          locale={locale}
          categories={data.categories}
        />

        <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-6 md:space-y-10 md:px-6 md:py-8 lg:px-8">
          {/* Spotlight: product + offer/promos */}
          <section aria-label={dict.home.featuredInstrumentEyebrow}>
            <SectionHeader
              eyebrow={dict.home.featuredEyebrow}
              title={dict.home.featuredTitle}
            />
            <div className="grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-7">
                {data.featuredInstrument ? (
                  <FeaturedInstrument
                    dict={dict}
                    locale={locale}
                    product={data.featuredInstrument}
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-3 lg:col-span-5">
                {featuredOffer ? (
                  <FeaturedOfferModule
                    offer={featuredOffer}
                    dict={dict}
                    locale={locale}
                  />
                ) : null}
                {promoBands.length > 0 ? (
                  <PromoBands
                    locale={locale}
                    bands={promoBands.map((b) => ({
                      id: b.id,
                      slug: b.slug,
                      titleAr: b.titleAr,
                      titleEn: b.titleEn,
                      bodyAr: b.bodyAr,
                      bodyEn: b.bodyEn,
                      ctaLabelAr: b.ctaLabelAr,
                      ctaLabelEn: b.ctaLabelEn,
                      href: b.href,
                      tone: b.tone,
                      imagePath: b.imagePath,
                    }))}
                  />
                ) : null}
              </div>
            </div>
          </section>

          {/* Primary shop grid */}
          {shopFallback.length > 0 ? (
            <section id="shop">
              <div id="latest" />
              <SectionHeader
                eyebrow={dict.home.latestRailEyebrow}
                title={dict.home.latestRailTitle}
                href={href("/catalog", locale)}
                actionLabel={dict.home.viewCollection}
              />
              <ProductGrid
                products={shopFallback}
                locale={locale}
                dict={dict}
                className="gap-3 md:gap-4"
              />
            </section>
          ) : null}

          {/* Browse categories */}
          {data.categories.length > 0 ? (
            <CategoryExplorer
              dict={dict}
              locale={locale}
              categories={data.categories}
            />
          ) : null}

          {/* Accessories only — avoids repeating the full instrument catalog */}
          {accessories.length > 0 ? (
            <section>
              <SectionHeader
                eyebrow={dict.home.secondaryRailEyebrow}
                title={localizedName(
                  locale,
                  accessories[0]!.category.nameAr,
                  accessories[0]!.category.nameEn
                )}
                href={`${href("/catalog", locale)}?type=accessories`}
                actionLabel={dict.home.categoriesCta}
              />
              <ProductGrid
                products={accessories}
                locale={locale}
                dict={dict}
                className="gap-3 md:gap-4"
              />
            </section>
          ) : null}

          {/* Utility footer modules — same container, clear rhythm */}
          <section className="grid gap-3 lg:grid-cols-2">
            <HomeOudEditorial dict={dict} />
            <HomeHandoff dict={dict} />
          </section>

          <TraderBand dict={dict} />
        </div>
      </div>
    </HomepageShell>
  );
}
