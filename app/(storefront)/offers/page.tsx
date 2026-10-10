import type { Metadata } from "next";
import { OfferCard } from "@/components/storefront/offer-card";
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

  return (
    <section className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm text-ro-muted ltr:tracking-[0.2em]">{dict.brand}</p>
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
        <ul className="grid gap-5 md:grid-cols-2 md:gap-6">
          {offers.map((o) => (
            <li key={o.id}>
              <OfferCard
                href={href(`/offers/${o.slug}`, locale)}
                title={localizedName(locale, o.titleAr, o.titleEn, o.slug)}
                summary={localizedName(locale, o.summaryAr, o.summaryEn)}
                eyebrow={dict.offers.eyebrow}
                ctaLabel={dict.offers.viewOffer}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
