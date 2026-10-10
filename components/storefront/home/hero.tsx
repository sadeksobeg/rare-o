"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/storefront/brand-mark";
import { useReducedMotion } from "@/components/storefront/motion/use-reduced-motion";
import { useScrollProgress } from "@/components/storefront/motion/use-scroll-progress";
import { RoButtonLink } from "@/components/ui/ro-button";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { HomepageProduct } from "@/lib/catalog/homepage";
import { EDITORIAL } from "@/lib/brand/editorial";
import { cn, localizedName } from "@/lib/utils";

/**
 * Hero V3 — editorial split composition.
 * OBJECT mass (photo column) → Arabic meaning → RARE OUD seal → Request.
 * Mark lives in the seam between photo and type — architectural, one only.
 */
export function HomeHero({
  dict,
  locale,
  product,
}: {
  dict: Dictionary;
  locale: Locale;
  product: HomepageProduct | null;
}) {
  const stageRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(stageRef);
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const p = reduced ? 0 : progress;
  const name = product
    ? localizedName(locale, product.nameAr, product.nameEn, product.slug)
    : null;
  const category = product
    ? localizedName(locale, product.category.nameAr, product.category.nameEn)
    : null;
  const available = product?.availability !== "unavailable";
  const price = product
    ? Number(product.retailPrice).toLocaleString(locale)
    : null;

  return (
    <section
      ref={stageRef}
      className="ro-hero-v3 relative -mt-[4.75rem] h-[120vh] bg-ro-black pt-[4.75rem] text-ro-cream md:-mt-[5.25rem] md:h-[125vh] md:pt-[5.25rem]"
    >
      <div className="sticky top-0 flex h-svh w-full flex-col overflow-hidden bg-ro-black">
        <div className="relative flex min-h-0 w-full flex-1 flex-col md:flex-row rtl:md:flex-row-reverse">
          {/* ——— OBJECT COLUMN (protagonist) ——— */}
          <div
            className={cn(
              "relative z-[1] min-h-[58vh] w-full flex-1 overflow-hidden md:min-h-0 md:w-[62%] md:flex-none lg:w-[64%]",
              ready && !reduced && "ro-hero-photo-settle"
            )}
            style={{
              transform: reduced
                ? undefined
                : `scale(${1 + p * 0.035}) translate3d(0, ${p * 1.8}%, 0)`,
              transformOrigin: "center 38%",
            }}
          >
            <div className="ro-hero-atmosphere absolute inset-0" aria-hidden />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={EDITORIAL.instrumentDark}
              alt=""
              className="ro-hero-oud absolute inset-0 h-full w-full object-cover"
            />

            {/* Craft intimacy — continuous with the body, soft dissolve */}
            <div
              className="ro-hero-craft pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[46%] md:h-[40%]"
              style={{
                opacity: reduced ? 0.8 : Math.max(0.5, 0.9 - p * 0.4),
              }}
              aria-hidden
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={EDITORIAL.heroCloseup}
                alt=""
                className="h-full w-full object-cover object-[40%_35%]"
              />
            </div>

            <div className="ro-hero-seam absolute inset-y-0 z-[2] hidden w-20 ltr:right-0 rtl:left-0 md:block md:w-28" aria-hidden />
            {/* Mobile dissolve into type */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-28 bg-gradient-to-t from-ro-black via-ro-black/70 to-transparent md:hidden"
              aria-hidden
            />
          </div>

          {/* ——— MEANING COLUMN — overlaps photo seam ——— */}
          <div
            className={cn(
              "relative z-10 flex w-full flex-1 flex-col justify-end bg-ro-black px-5 pb-20 pt-2 md:w-[38%] md:flex-none md:justify-center md:px-10 md:pb-20 md:pt-16 md:ltr:-ms-8 md:rtl:-me-8 lg:w-[36%] lg:px-12",
              ready && !reduced && "ro-hero-copy-in"
            )}
            style={{
              transform: reduced ? undefined : `translate3d(0, ${p * -3}%, 0)`,
            }}
          >
            {/* Mark intersects the seam — desktop/architectural */}
            <div
              className={cn(
                "pointer-events-none absolute top-[14%] z-20 hidden opacity-95 ltr:-left-6 rtl:-right-8 md:block md:top-[20%] md:ltr:-left-12 md:rtl:-right-12",
                ready && !reduced && "ro-mark-reveal"
              )}
              aria-hidden
            >
              <BrandMark
                variant="master"
                tone="on-dark"
                size="md"
                priority
                className="h-14 w-14 md:h-[4.5rem] md:w-[4.5rem] lg:h-20 lg:w-20"
              />
            </div>

            <div className="relative space-y-6 md:space-y-8">
              <h1
                className={cn(
                  "font-display text-[clamp(2rem,4.2vw,3.5rem)] leading-[1.22] tracking-wide text-ro-cream",
                  ready && !reduced && "ro-hero-line-a"
                )}
              >
                {dict.home.headline}
              </h1>

              <div
                className={cn(
                  "flex items-center gap-3",
                  ready && !reduced && "ro-hero-line-b"
                )}
              >
                <BrandMark
                  variant="master"
                  tone="on-dark"
                  size="sm"
                  className="h-8 w-8 shrink-0 md:hidden"
                />
                <span className="hidden h-px w-8 bg-ro-line-on-dark md:block" aria-hidden />
                <p className="font-display text-[0.8rem] tracking-[0.4em] text-ro-ivory-muted md:text-[0.9rem]">
                  {dict.brand}
                </p>
              </div>

              {product && name ? (
                <div
                  className={cn(
                    "space-y-1 border-s border-ro-line-on-dark ps-4",
                    ready && !reduced && "ro-hero-line-c"
                  )}
                >
                  {category ? (
                    <p className="text-[0.7rem] text-ro-ivory-muted/80">{category}</p>
                  ) : null}
                  <Link
                    href={`/product/${product.slug}`}
                    className="font-display text-lg text-ro-cream/95 hover:text-ro-cream md:text-xl"
                  >
                    {name}
                  </Link>
                  <p className="text-sm text-ro-ivory-muted">
                    {price} {product.currency}
                    <span className="ms-3 text-[0.65rem]">
                      {available ? dict.home.available : dict.home.unavailable}
                    </span>
                  </p>
                </div>
              ) : (
                <p
                  className={cn(
                    "text-[0.95rem] leading-[1.75] text-ro-ivory-muted",
                    ready && !reduced && "ro-hero-line-c"
                  )}
                >
                  {dict.home.sub}
                </p>
              )}

              <div
                className={cn(
                  "flex flex-wrap items-center gap-3 pt-1",
                  ready && !reduced && "ro-hero-line-d"
                )}
              >
                {product && available && name ? (
                  <AddToCartButton
                    productId={product.id}
                    slug={product.slug}
                    name={name}
                    price={Number(product.retailPrice)}
                    currency={product.currency}
                    label={dict.home.requestPiece}
                  />
                ) : null}
                <RoButtonLink href="/catalog" variant="on-dark">
                  {dict.home.ctaCatalog}
                </RoButtonLink>
              </div>
            </div>
          </div>
        </div>

        {/* Cream exit bridge */}
        <div
          className="pointer-events-none relative z-20 h-16 shrink-0 md:h-20"
          aria-hidden
        >
          <div className="ro-hero-exit absolute inset-0" />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ opacity: reduced ? 0.45 : Math.min(0.7, 0.25 + p * 0.55) }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={EDITORIAL.heroSignature}
              alt=""
              className="h-[180%] w-full object-cover object-[25%_70%] opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#F4E7D8] via-[#F4E7D8]/92 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
