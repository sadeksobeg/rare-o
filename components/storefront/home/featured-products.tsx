"use client";

import {
  FeaturedProductLead,
  ProductCard,
  type ProductCardData,
} from "@/components/storefront/product-card";
import { Reveal } from "@/components/storefront/motion";
import { SectionLabel } from "@/components/storefront/section-label";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

export function HomeFeaturedProducts({
  dict,
  locale,
  products,
}: {
  dict: Dictionary;
  locale: Locale;
  products: ProductCardData[];
}) {
  const [lead, ...support] = products;

  return (
    <section className="border-b border-ro-line bg-ro-cream">
      <div className="mx-auto max-w-[1440px] space-y-12 px-5 py-16 md:px-8 md:py-24 lg:space-y-16 lg:px-12 lg:py-28">
        <div className="grid gap-6 md:grid-cols-12 md:items-end md:gap-10">
          <div className="space-y-4 md:col-span-6 lg:col-span-5">
            <Reveal variant="up">
              <SectionLabel tone="purple">{dict.home.featuredEyebrow}</SectionLabel>
            </Reveal>
            <Reveal variant="mask" delayMs={80}>
              <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] tracking-wide text-ro-black">
                {dict.home.featuredTitle}
              </h2>
            </Reveal>
          </div>
          <Reveal variant="up" delayMs={140} className="md:col-span-5 md:col-start-8 md:justify-self-end">
            <p className="max-w-sm text-sm leading-[1.75] text-ro-muted md:text-base">
              {dict.home.featuredIntro}
            </p>
          </Reveal>
        </div>

        {products.length === 0 ? (
          <p className="text-ro-muted">{dict.home.featuredEmpty}</p>
        ) : (
          <div className="space-y-12 lg:space-y-16">
            {lead ? (
              <Reveal variant="up">
                <FeaturedProductLead
                  product={lead}
                  locale={locale}
                  viewLabel={dict.home.viewProduct}
                  availableLabel={dict.home.available}
                  unavailableLabel={dict.home.unavailable}
                  eyebrow={dict.home.featuredLead}
                />
              </Reveal>
            ) : null}

            {support.length > 0 ? (
              <div className="space-y-4">
                <p className="text-[0.65rem] tracking-[0.28em] text-ro-muted uppercase lg:hidden">
                  {dict.home.featuredEyebrow}
                </p>
                {/* Desktop: one horizontal editorial track */}
                <ul className="ro-track md:gap-8">
                  {support.map((product, i) => (
                    <li key={product.id}>
                      <ProductCard
                        product={product}
                        locale={locale}
                        viewLabel={dict.home.viewProduct}
                        availableLabel={dict.home.available}
                        unavailableLabel={dict.home.unavailable}
                        tone={i % 2 === 0 ? "dark" : "purple"}
                        aspect={i % 2 === 0 ? "portrait" : "square"}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
