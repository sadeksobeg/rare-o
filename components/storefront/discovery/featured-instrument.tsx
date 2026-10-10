"use client";

import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { HomepageProduct } from "@/lib/catalog/homepage";
import { MaterialField } from "@/components/storefront/material-field";
import { SectionLabel } from "@/components/storefront/section-label";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { RoButtonLink } from "@/components/ui/ro-button";
import { EDITORIAL } from "@/lib/brand/editorial";
import { localizedName } from "@/lib/utils";
import { ENABLE_COMPARE } from "@/lib/features";
import { href } from "@/lib/href";
import { useDiscovery } from "./discovery-context";

export function FeaturedInstrument({
  dict,
  locale,
  product,
}: {
  dict: Dictionary;
  locale: Locale;
  product: HomepageProduct;
}) {
  const { openQuickView, toggleCompare, compareIds } = useDiscovery();
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
  const price = Number(product.retailPrice).toLocaleString(locale);
  const comparing = compareIds.includes(product.id);

  return (
    <section className="border-b border-ro-line bg-ro-cream">
      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-12">
        <div className="relative min-h-[420px] overflow-hidden bg-ro-black lg:col-span-8 lg:min-h-[640px]">
          {/* Editorial atmosphere behind catalog imagery */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={EDITORIAL.instrumentDark}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-ro-black/25" />
          <MaterialField
            src={product.images[0]?.path}
            alt={name}
            tone="dark"
            className="absolute inset-[8%] md:inset-[10%]"
          />
        </div>
        <div className="flex flex-col justify-center gap-6 px-5 py-12 md:px-8 lg:col-span-4 lg:px-10 lg:py-16">
          <SectionLabel tone="purple">
            {dict.home.featuredInstrumentEyebrow}
          </SectionLabel>
          <p className="text-[0.65rem] tracking-[0.22em] text-ro-muted uppercase">
            {category}
          </p>
          <h2 className="font-display text-3xl tracking-wide md:text-4xl lg:text-[2.75rem]">
            <Link
              href={href(`/product/${product.slug}`, locale)}
              className="hover:text-ro-purple"
            >
              {name}
            </Link>
          </h2>
          <div className="flex flex-wrap gap-3 text-sm text-ro-muted">
            <span>
              {price} {product.currency}
            </span>
            <span className="text-[0.65rem] tracking-[0.16em] uppercase">
              {available ? dict.home.available : dict.home.unavailable}
            </span>
          </div>
          {description ? (
            <p className="text-sm leading-relaxed text-ro-muted line-clamp-5">
              {description}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3 pt-2">
            {available ? (
              <AddToCartButton
                productId={product.id}
                slug={product.slug}
                name={name}
                price={Number(product.retailPrice)}
                currency={product.currency}
                imagePath={product.images[0]?.path ?? null}
                label={dict.home.requestPiece}
              />
            ) : null}
            <button
              type="button"
              onClick={() => openQuickView(product.id)}
              className="border border-ro-line px-5 py-3 text-[0.7rem] tracking-[0.16em] uppercase hover:border-ro-purple"
            >
              {dict.home.quickView}
            </button>
            {ENABLE_COMPARE ? (
              <button
                type="button"
                onClick={() => toggleCompare(product.id)}
                className={`px-3 py-3 text-[0.65rem] tracking-[0.16em] uppercase ${
                  comparing ? "text-ro-purple" : "text-ro-muted hover:text-ro-black"
                }`}
              >
                {comparing ? dict.home.compareRemove : dict.home.compareAdd}
              </button>
            ) : null}
          </div>
          <RoButtonLink
            href={href(`/product/${product.slug}`, locale)}
            variant="ghost"
            className="self-start px-0"
          >
            {dict.home.viewDetails}
          </RoButtonLink>
        </div>
      </div>
    </section>
  );
}
