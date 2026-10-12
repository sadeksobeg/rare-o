import type { Metadata } from "next";
import { OfferCard } from "@/components/storefront/offer-card";
import { Reveal } from "@/components/storefront/motion/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { listPublishedPublicOffers } from "@/lib/offers/service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { storefrontMetadata } from "@/lib/seo";
import { localizedName } from "@/lib/utils";
import { href } from "@/lib/href";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getRequestDictionary();
  return storefrontMetadata({
    locale,
    title: `${dict.offers.title} — ${dict.brand}`,
    description: dict.offers.sub,
    path: "/offers",
  });
}

export default async function PublicOffersPage() {
  const offers = await listPublishedPublicOffers();
  const { locale, dict } = await getRequestDictionary();
  const [lead, ...rest] = offers;

  return (
    <section className="space-y-10">
      <header className="space-y-3">
        <p className="ro-type-overline text-ro-plum">{dict.offers.eyebrow}</p>
        <h1 className="ro-type-h1">{dict.offers.title}</h1>
        <p className="max-w-2xl text-ro-muted">{dict.offers.sub}</p>
      </header>
      {offers.length === 0 ? (
        <EmptyState
          title={dict.offers.empty}
          actionHref={href("/catalog", locale)}
          actionLabel={dict.nav.catalog}
        />
      ) : (
        <div className="space-y-6">
          {lead ? (
            <Reveal>
              <OfferCard
                featured
                tone="dark"
                href={href(`/offers/${lead.slug}`, locale)}
                title={localizedName(
                  locale,
                  lead.titleAr,
                  lead.titleEn,
                  lead.slug
                )}
                summary={localizedName(
                  locale,
                  lead.summaryAr,
                  lead.summaryEn
                )}
                eyebrow={dict.home.featuredOfferEyebrow}
                ctaLabel={dict.offers.viewOffer}
              />
            </Reveal>
          ) : null}
          {rest.length > 0 ? (
            <ul className="grid gap-5 md:grid-cols-2 md:gap-6">
              {rest.map((o, i) => (
                <li key={o.id}>
                  <Reveal delayMs={i * 50}>
                    <OfferCard
                      href={href(`/offers/${o.slug}`, locale)}
                      title={localizedName(
                        locale,
                        o.titleAr,
                        o.titleEn,
                        o.slug
                      )}
                      summary={localizedName(
                        locale,
                        o.summaryAr,
                        o.summaryEn
                      )}
                      eyebrow={dict.offers.eyebrow}
                      ctaLabel={dict.offers.viewOffer}
                    />
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </section>
  );
}
