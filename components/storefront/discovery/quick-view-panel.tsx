"use client";

import { useEffect } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { localizedName } from "@/lib/utils";
import { href } from "@/lib/href";
import { MaterialField } from "@/components/storefront/material-field";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { RoButtonLink } from "@/components/ui/ro-button";
import { useDiscovery } from "./discovery-context";

export function QuickViewPanel({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const { products, quickViewId, closeQuickView } = useDiscovery();
  const product = products.find((p) => p.id === quickViewId) ?? null;

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeQuickView();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [product, closeQuickView]);

  if (!product) return null;

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
  const specs = localizedName(locale, product.specsTextAr, product.specsTextEn);
  const available = product.availability !== "unavailable";
  const price = Number(product.retailPrice).toLocaleString(locale);

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-ro-black/50"
        aria-label={dict.home.quickViewClose}
        onClick={closeQuickView}
      />
      <aside className="ro-panel-slide relative z-10 flex h-full w-full max-w-lg flex-col border-s border-ro-line bg-ro-cream text-ro-black shadow-[-20px_0_60px_rgba(11,8,13,0.25)]">
        <div className="flex items-center justify-between border-b border-ro-line px-5 py-4">
          <p className="text-[0.65rem] tracking-[0.28em] text-ro-purple uppercase">
            {dict.home.quickView}
          </p>
          <button
            type="button"
            onClick={closeQuickView}
            className="text-[0.65rem] tracking-[0.2em] uppercase text-ro-muted hover:text-ro-black"
          >
            {dict.home.quickViewClose}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <MaterialField
            src={product.images[0]?.path}
            alt={name}
            tone="dark"
            className="aspect-[5/4] w-full"
          />
          <div className="space-y-5 p-6">
            <p className="text-[0.65rem] tracking-[0.22em] text-ro-muted uppercase">
              {category}
            </p>
            <h2 className="font-display text-3xl tracking-wide">{name}</h2>
            <div className="flex flex-wrap gap-3 text-sm text-ro-muted">
              <span>
                {price} {product.currency}
              </span>
              <span className="text-[0.65rem] tracking-[0.16em] uppercase">
                {available ? dict.home.available : dict.home.unavailable}
              </span>
            </div>
            {description ? (
              <p className="text-sm leading-relaxed text-ro-muted line-clamp-6">
                {description}
              </p>
            ) : null}
            {specs ? (
              <div>
                <p className="mb-2 text-[0.65rem] tracking-[0.2em] text-ro-purple uppercase">
                  {dict.product.specs}
                </p>
                <p className="whitespace-pre-wrap text-sm text-ro-muted line-clamp-8">
                  {specs}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-ro-line p-5">
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
          ) : (
            <span className="px-4 py-3 text-sm text-ro-muted">
              {dict.product.unavailable}
            </span>
          )}
          <RoButtonLink
            href={href(`/product/${product.slug}`, locale)}
            variant="secondary"
          >
            {dict.home.viewDetails}
          </RoButtonLink>
        </div>
      </aside>
    </div>
  );
}
