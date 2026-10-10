import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { HomepageOffer, HomepageProduct } from "@/lib/catalog/homepage";
import { SectionLabel } from "@/components/storefront/section-label";
import { MaterialField } from "@/components/storefront/material-field";
import { localizedName } from "@/lib/utils";
import { MosaicTile } from "./mosaic-tile";

export function OffersRail({
  dict,
  locale,
  offers,
}: {
  dict: Dictionary;
  locale: Locale;
  offers: HomepageOffer[];
}) {
  if (offers.length === 0) return null;

  return (
    <section id="curated" className="border-b border-ro-line bg-ro-black text-ro-cream">
      <div className="mx-auto max-w-[1440px] space-y-8 px-5 py-16 md:px-8 md:py-20 lg:px-12">
        <div className="space-y-3">
          <SectionLabel tone="dark">{dict.home.curatedRailEyebrow}</SectionLabel>
          <h2 className="font-display text-3xl tracking-wide md:text-4xl">
            {dict.home.curatedRailTitle}
          </h2>
        </div>
        <ul className="ro-track gap-5">
          {offers.map((o) => {
            const title = localizedName(locale, o.titleAr, o.titleEn, o.slug);
            const summary = localizedName(locale, o.summaryAr, o.summaryEn);
            return (
              <li key={o.id} className="min-w-[18rem] max-w-sm shrink-0">
                <Link
                  href={`/offers/${o.slug}`}
                  className="group block space-y-4 border border-ro-line-on-dark p-5 transition-colors hover:border-ro-cream"
                >
                  <h3 className="font-display text-2xl tracking-wide group-hover:text-ro-cream">
                    {title}
                  </h3>
                  {summary ? (
                    <p className="text-sm text-ro-ivory-muted line-clamp-3">{summary}</p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function ProductsRail({
  dict,
  locale,
  products,
  eyebrow,
  title,
  id,
  tone = "cream",
}: {
  dict: Dictionary;
  locale: Locale;
  products: HomepageProduct[];
  eyebrow: string;
  title: string;
  id?: string;
  tone?: "cream" | "surface";
}) {
  if (products.length === 0) return null;

  return (
    <section
      id={id}
      className={`border-b border-ro-line ${
        tone === "surface" ? "bg-ro-surface" : "bg-ro-cream"
      }`}
    >
      <div className="mx-auto max-w-[1440px] space-y-8 px-5 py-16 md:px-8 md:py-20 lg:px-12">
        <div className="space-y-3">
          <SectionLabel tone="purple">{eyebrow}</SectionLabel>
          <h2 className="font-display text-3xl tracking-wide md:text-4xl">{title}</h2>
        </div>
        <ul className="ro-track gap-5 md:gap-6">
          {products.map((p) => (
            <li key={p.id} className="w-[16rem] shrink-0 md:w-[20rem]">
              <MosaicTile product={p} dict={dict} locale={locale} size="md" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Lightweight preview used when mosaic tile is too heavy — keep for future */
export function RailPreviewCard({
  locale,
  product,
}: {
  locale: Locale;
  product: HomepageProduct;
}) {
  const name = localizedName(locale, product.nameAr, product.nameEn, product.slug);
  return (
    <Link href={`/product/${product.slug}`} className="block space-y-3">
      <MaterialField
        src={product.images[0]?.path}
        alt={name}
        className="aspect-[4/5]"
      />
      <p className="font-display text-xl">{name}</p>
    </Link>
  );
}
