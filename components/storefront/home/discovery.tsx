import Link from "next/link";
import { MediaPlane } from "@/components/storefront/media-plane";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";
import { SectionLabel } from "@/components/storefront/section-label";
import { RoButtonLink } from "@/components/ui/ro-button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { localizedName } from "@/lib/utils";

export type DiscoveryOffer = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
};

export function HomeDiscovery({
  dict,
  locale,
  offers,
  products,
}: {
  dict: Dictionary;
  locale: Locale;
  offers: DiscoveryOffer[];
  products: ProductCardData[];
}) {
  const hasOffers = offers.length > 0;
  const leadOffer = offers[0];
  const supportOffers = offers.slice(1, 3);
  const supportProducts = products.slice(0, 3);

  return (
    <section className="border-b border-ro-line bg-ro-cream">
      <div className="mx-auto max-w-[1440px] space-y-14 px-5 py-20 md:px-8 md:py-28 lg:px-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-4">
            <SectionLabel tone="purple">{dict.home.discoveryEyebrow}</SectionLabel>
            <h2 className="font-display text-3xl tracking-wide text-ro-black md:text-4xl lg:text-5xl">
              {dict.home.discoveryTitle}
            </h2>
            <p className="text-sm leading-relaxed text-ro-muted md:text-base">
              {dict.home.discoverySub}
            </p>
          </div>
          <RoButtonLink href="/offers" variant="secondary" className="shrink-0 self-start md:self-auto">
            {dict.home.discoveryCta}
          </RoButtonLink>
        </div>

        {hasOffers ? (
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            {leadOffer ? (
              <Link
                href={`/offers/${leadOffer.slug}`}
                className="group space-y-5 lg:col-span-7"
              >
                <MediaPlane aspect="wide" tone="alt" className="min-h-[300px] md:min-h-[400px]" />
                <div className="space-y-3">
                  <h3 className="font-display text-3xl tracking-wide text-ro-black transition-colors duration-300 group-hover:text-ro-purple md:text-4xl">
                    {localizedName(
                      locale,
                      leadOffer.titleAr,
                      leadOffer.titleEn,
                      leadOffer.slug
                    )}
                  </h3>
                  <p className="max-w-lg text-sm leading-relaxed text-ro-muted">
                    {localizedName(
                      locale,
                      leadOffer.summaryAr,
                      leadOffer.summaryEn
                    )}
                  </p>
                </div>
              </Link>
            ) : null}

            <ul className="flex flex-col divide-y divide-ro-line border-y border-ro-line lg:col-span-5">
              {supportOffers.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/offers/${item.slug}`}
                    className="group block space-y-2 py-7 transition-colors"
                  >
                    <h3 className="font-display text-2xl tracking-wide text-ro-black group-hover:text-ro-purple">
                      {localizedName(locale, item.titleAr, item.titleEn, item.slug)}
                    </h3>
                    <p className="text-sm text-ro-muted line-clamp-2">
                      {localizedName(locale, item.summaryAr, item.summaryEn)}
                    </p>
                  </Link>
                </li>
              ))}
              {supportOffers.length === 0 ? (
                <li className="py-7 text-sm text-ro-muted">{dict.home.discoveryEmpty}</li>
              ) : null}
            </ul>
          </div>
        ) : supportProducts.length > 0 ? (
          <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            {supportProducts.map((product) => (
              <li key={product.id}>
                <ProductCard
                  product={product}
                  locale={locale}
                  viewLabel={dict.home.viewProduct}
                  availableLabel={dict.home.available}
                  unavailableLabel={dict.home.unavailable}
                  aspect="square"
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="max-w-xl text-ro-muted">{dict.home.discoveryEmpty}</p>
        )}
      </div>
    </section>
  );
}
