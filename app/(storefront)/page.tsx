import type { Metadata } from "next";
import Link from "next/link";
import { storefrontMetadata } from "@/lib/seo";
import { HomepageShell } from "@/components/storefront/discovery/homepage-shell";
import { CategoryExplorer } from "@/components/storefront/discovery/category-explorer";
import { FeaturedInstrument } from "@/components/storefront/discovery/featured-instrument";
import {
  OffersRail,
} from "@/components/storefront/discovery/discovery-rail";
import { HeroResonance } from "@/components/storefront/home/hero-resonance";
import { TrustStrip } from "@/components/storefront/home/trust-strip";
import { HomeOudEditorial } from "@/components/storefront/home/oud-editorial";
import { HandoffExplainer } from "@/components/storefront/handoff-explainer";
import { TraderBand } from "@/components/storefront/trader-band";
import { StorefrontFooter } from "@/components/storefront/footer";
import { ProductGrid } from "@/components/storefront/catalog/product-grid";
import { getHomepageDiscoveryData } from "@/lib/catalog/homepage";
import { getRequestDictionary } from "@/lib/i18n/server";
import { EDITORIAL } from "@/lib/brand/editorial";
import { href } from "@/lib/href";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getRequestDictionary();
  return storefrontMetadata({
    locale,
    title: `${dict.brand} — ${dict.home.headline}`,
    description: dict.home.sub,
    path: "/",
  });
}

/** SF-01 H1–H9 stack — sections omit when data is absent. */
export default async function HomePage() {
  const { locale, dict } = await getRequestDictionary();
  const data = await getHomepageDiscoveryData();

  const latest = data.latest
    .filter((p) => p.id !== data.featuredInstrument?.id)
    .slice(0, 8);

  return (
    <HomepageShell dict={dict} locale={locale} data={data}>
      <div data-page="home">
        {/* H1 */}
        <HeroResonance
          dict={dict}
          locale={locale}
          imageSrc={EDITORIAL.instrumentDark}
        />

        {/* H2 */}
        <TrustStrip dict={dict} />

        {/* H3 */}
        {data.featuredInstrument ? (
          <FeaturedInstrument
            dict={dict}
            locale={locale}
            product={data.featuredInstrument}
          />
        ) : null}

        {/* H4 */}
        {data.categories.length > 0 ? (
          <CategoryExplorer
            dict={dict}
            locale={locale}
            categories={data.categories}
          />
        ) : null}

        {/* H5 */}
        {data.offers.length > 0 ? (
          <OffersRail dict={dict} locale={locale} offers={data.offers} />
        ) : null}

        {/* H6 */}
        {latest.length > 0 ? (
          <section
            id="latest"
            className="border-b border-ro-line bg-ro-canvas px-5 py-16 md:px-8 lg:px-12"
          >
            <div className="mx-auto max-w-[1440px] space-y-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="ro-type-overline text-ro-plum">
                    {dict.home.latestRailEyebrow}
                  </p>
                  <h2 className="ro-type-h2 mt-2">
                    {dict.home.latestRailTitle}
                  </h2>
                </div>
                <Link
                  href={href("/catalog", locale)}
                  className="text-sm font-semibold text-ro-plum hover:underline"
                >
                  {dict.home.viewCollection}
                </Link>
              </div>
              <ProductGrid products={latest} locale={locale} dict={dict} />
            </div>
          </section>
        ) : null}

        {/* H7 */}
        <div id="story">
          <HomeOudEditorial dict={dict} />
        </div>

        {/* H8 */}
        <HandoffExplainer dict={dict} />

        {/* H9 */}
        <TraderBand dict={dict} />

        <StorefrontFooter dict={dict} locale={locale} />
      </div>
    </HomepageShell>
  );
}
