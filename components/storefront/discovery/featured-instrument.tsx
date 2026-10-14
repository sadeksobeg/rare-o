"use client";

import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { HomepageProduct } from "@/lib/catalog/homepage";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { PriceBlock } from "@/components/storefront/catalog/price-block";
import { localizedName } from "@/lib/utils";
import { href } from "@/lib/href";
import { useDiscovery } from "./discovery-context";

/** Spotlight product panel for the home spotlight grid. */
export function FeaturedInstrument({
  dict,
  locale,
  product,
}: {
  dict: Dictionary;
  locale: Locale;
  product: HomepageProduct;
}) {
  const { openQuickView } = useDiscovery();
  const name = localizedName(locale, product.nameAr, product.nameEn, product.slug);
  const category = localizedName(
    locale,
    product.category.nameAr,
    product.category.nameEn
  );
  const description = localizedName(
    locale,
    product.descriptionAr,
    product.descriptionEn
  );
  const available = product.availability !== "unavailable";
  const image = product.images[0];

  return (
    <article className="grid h-full overflow-hidden border border-ro-line bg-ro-paper sm:grid-cols-[140px_1fr] lg:grid-cols-[180px_1fr]">
      <div className="relative aspect-[4/5] bg-[var(--ro-ink-900)] sm:aspect-auto sm:min-h-[220px]">
        {image?.path ? (
          <Image
            src={image.path}
            alt={name}
            fill
            sizes="180px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs tracking-widest text-ro-canvas/40">
            {dict.brand}
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between gap-3 p-4 md:p-5">
        <div className="space-y-2">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ro-plum">
            {dict.home.featuredInstrumentEyebrow}
            {category ? `  ${category}` : ""}
          </p>
          <h2 className="font-display text-xl tracking-wide md:text-2xl">
            <Link
              href={href(`/product/${product.slug}`, locale)}
              className="hover:text-ro-plum"
            >
              {name}
            </Link>
          </h2>
          {description ? (
            <p className="line-clamp-2 text-sm text-ro-text-2">{description}</p>
          ) : null}
          <div className="flex flex-wrap items-end gap-2">
            <PriceBlock
              price={Number(product.retailPrice)}
              compareAtPrice={
                product.compareAtPrice != null
                  ? Number(product.compareAtPrice)
                  : null
              }
              currency={product.currency}
              locale={locale}
              onRequestLabel={dict.product.priceOnRequest}
              wasLabel={dict.product.priceWas}
              nowLabel={dict.product.priceNow}
              onSaleLabel={dict.product.onSale}
            />
            <span className="text-xs text-ro-muted">
              {available ? dict.home.available : dict.home.unavailable}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {available ? (
            <AddToCartButton
              productId={product.id}
              slug={product.slug}
              name={name}
              price={Number(product.retailPrice)}
              currency={product.currency}
              imagePath={image?.path ?? null}
              label={dict.home.requestPiece}
            />
          ) : null}
          <button
            type="button"
            onClick={() => openQuickView(product.id)}
            className="h-11 border border-ro-line px-4 text-sm font-semibold hover:border-ro-plum"
          >
            {dict.home.quickView}
          </button>
        </div>
      </div>
    </article>
  );
}
