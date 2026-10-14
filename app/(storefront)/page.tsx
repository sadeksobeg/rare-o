import type { Metadata } from "next";
import { storefrontMetadata } from "@/lib/seo";
import { HomepageShell } from "@/components/storefront/discovery/homepage-shell";
import { CategoryExplorer } from "@/components/storefront/discovery/category-explorer";
import { FeaturedInstrument } from "@/components/storefront/discovery/featured-instrument";
import { HeroResonance } from "@/components/storefront/home/hero-resonance";
import { TrustStrip } from "@/components/storefront/home/trust-strip";
import { SectionHeading } from "@/components/storefront/section-heading";
import { OfferCard } from "@/components/storefront/offer-card";
import { EditorialSplit } from "@/components/storefront/editorial-split";
import { HandoffExplainer } from "@/components/storefront/handoff-explainer";
import { TraderBand } from "@/components/storefront/trader-band";
import { ProductGrid } from "@/components/storefront/catalog/product-grid";
import { Reveal } from "@/components/storefront/motion";
import { ButtonLink } from "@/components/ui/button";
import { getHomepageDiscoveryData } from "@/lib/catalog/homepage";
import { getRequestDictionary } from "@/lib/i18n/server";
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
 * SF-01 Home — locked H1–H9 stack (D41b).
 * H1 Hero → H2 TrustStrip → H3 Featured → H4 Collections → H5 Offers →
 * H6 Latest → H7 EditorialSplit → H8 HandoffExplainer → H9 TraderBand
 */
export default async function HomePage() {
  const { locale, dict } = await getRequestDictionary();
  const data = await getHomepageDiscoveryData();

  const featuredId = data.featuredInstrument?.id;
  const latest = data.latest
    .filter((p) => p.id !== featuredId)
    .slice(0, 8);
  const latestFallback = latest.length > 0 ? latest : data.latest.slice(0, 8);
  const offers = data.offers.slice(0, 3);
  const featuredOffer = offers[0] ?? null;
  const sideOffers = offers.slice(1, 3);

  return (
    <HomepageShell dict={dict} locale={locale} data={data}>
      <div data-page="home" data-skin="h1-h9">
        {/* H1 */}
        <div data-home-block="H1">
          <HeroResonance dict={dict} locale={locale} />
        </div>

        {/* H2 */}
        <div data-home-block="H2">
          <TrustStrip dict={dict} />
        </div>

        {/* H3 Featured instrument — sunken; omitted when none (never empty shell) */}
        {data.featuredInstrument ? (
          <section
            data-home-block="H3"
            className="relative overflow-hidden border-b border-ro-border bg-ro-sunken"
          >
            <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-8 md:py-24">
              <Reveal>
                <SectionHeading
                  eyebrow={dict.home.featuredEyebrow}
                  title={dict.home.featuredTitle}
                  className="mb-10"
                />
              </Reveal>
              <Reveal delayMs={120}>
                <FeaturedInstrument
                  dict={dict}
                  locale={locale}
                  product={data.featuredInstrument}
                />
              </Reveal>
            </div>
          </section>
        ) : null}

        {/* H4 Collections — omitted when none */}
        {data.categories.length > 0 ? (
          <section
            data-home-block="H4"
            className="border-b border-ro-border bg-ro-canvas"
          >
            <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-8 md:py-20">
              <Reveal>
                <CategoryExplorer
                  dict={dict}
                  locale={locale}
                  categories={data.categories}
                />
              </Reveal>
            </div>
          </section>
        ) : null}

        {/* H5 Offers — inverse; omitted when none */}
        {featuredOffer ? (
          <section
            data-home-block="H5"
            className="ro-inverse border-b border-ro-line-on-dark bg-[var(--ro-ink-950)]"
          >
            <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-8 md:py-20">
              <SectionHeading
                eyebrow={dict.home.featuredOfferEyebrow}
                title={dict.nav.offers}
                tone="dark"
                className="mb-8"
              />
              <div className="grid gap-4 lg:grid-cols-12">
                <div className={sideOffers.length ? "lg:col-span-7" : "lg:col-span-12"}>
                  <OfferCard
                    href={href(`/offers/${featuredOffer.slug}`, locale)}
                    title={localizedName(
                      locale,
                      featuredOffer.titleAr,
                      featuredOffer.titleEn,
                      featuredOffer.slug
                    )}
                    summary={localizedName(
                      locale,
                      featuredOffer.summaryAr,
                      featuredOffer.summaryEn
                    )}
                    eyebrow={dict.home.featuredOfferEyebrow}
                    ctaLabel={dict.home.featuredOfferCta}
                    tone="dark"
                    featured
                  />
                </div>
                {sideOffers.length > 0 ? (
                  <div className="flex flex-col gap-4 lg:col-span-5">
                    {sideOffers.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        href={href(`/offers/${offer.slug}`, locale)}
                        title={localizedName(
                          locale,
                          offer.titleAr,
                          offer.titleEn,
                          offer.slug
                        )}
                        summary={localizedName(
                          locale,
                          offer.summaryAr,
                          offer.summaryEn
                        )}
                        ctaLabel={dict.home.featuredOfferCta}
                        tone="dark"
                        headingLevel={3}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {/* H6 Latest pieces — omitted when none */}
        {latestFallback.length > 0 ? (
          <section
            id="latest"
            data-home-block="H6"
            className="border-b border-ro-border bg-ro-canvas"
          >
            <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-8 md:py-20">
              <Reveal>
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                  <SectionHeading title={dict.home.latestPieces} />
                  <ButtonLink
                    href={href("/catalog", locale)}
                    variant="text"
                    size="sm"
                  >
                    {dict.home.viewCollection}
                  </ButtonLink>
                </div>
              </Reveal>
              <Reveal delayMs={100}>
                <ProductGrid
                  products={latestFallback}
                  locale={locale}
                  dict={dict}
                />
              </Reveal>
            </div>
          </section>
        ) : null}

        {/* H7 Craft story */}
        <div data-home-block="H7">
          <EditorialSplit
            eyebrow={dict.home.oudEyebrow}
            title={dict.home.oudTitle}
            body={dict.home.oudBody}
            pullQuote={dict.home.oudDetail}
            imageSrc="/brand/editorial-wood-grain.jpg"
            imageAlt=""
          />
        </div>

        {/* H8 How requesting works */}
        <section
          data-home-block="H8"
          className="border-b border-ro-border bg-ro-canvas"
        >
          <HandoffExplainer dict={dict} />
        </section>

        {/* H9 Trader band */}
        <div data-home-block="H9" className="relative overflow-hidden bg-[var(--ro-ink-950)] px-5 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-[1440px]">
            <TraderBand dict={dict} />
          </div>
        </div>
      </div>
    </HomepageShell>
  );
}
