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
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 85% 10%, rgba(82,39,124,0.1), transparent 70%), radial-gradient(ellipse 40% 45% at 15% 40%, rgba(184,134,63,0.07), transparent 65%)",
        }}
      />

      <section className="relative space-y-12 md:space-y-16">
        <Reveal>
          <header className="ro-section-accent max-w-3xl space-y-4 pt-3">
            <p className="ro-type-overline text-ro-plum">{dict.offers.eyebrow}</p>
            <h1 className="ro-type-h1 md:text-5xl">{dict.offers.title}</h1>
            <p className="text-base leading-relaxed text-ro-text-2 md:text-lg">
              {dict.offers.sub}
            </p>
          </header>
        </Reveal>

        {offers.length === 0 ? (
          <EmptyState
            title={dict.offers.empty}
            actionHref={href("/catalog", locale)}
            actionLabel={dict.nav.catalog}
          />
        ) : (
          <div className="space-y-8 md:space-y-10">
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
              <ul className="grid gap-5 sm:grid-cols-2 md:gap-7">
                {rest.map((o, i) => (
                  <li key={o.id}>
                    <Reveal delayMs={60 + i * 70}>
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
    </div>
  );
}
