import Image from "next/image";
import Link from "next/link";
import { ProductThumb } from "@/components/storefront/product-media";
import { AvailabilityChip } from "@/components/storefront/catalog/availability-chip";
import { PriceBlock } from "@/components/storefront/catalog/price-block";
import { QuickAddButton } from "@/components/storefront/catalog/quick-add-button";
import { href } from "@/lib/href";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn, localizedName } from "@/lib/utils";

export type CatalogCardProduct = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  retailPrice: { toString(): string } | number | string;
  currency: string;
  availability: string;
  category?: { nameAr: string; nameEn: string } | null;
  images: { path: string; altAr: string; altEn: string }[];
};

/**
 * S06 — catalog/related ProductCard. The title link is stretched over the whole
 * card; the quick-add button sits above it (desktop hover/focus only).
 */
export function CatalogProductCard({
  product,
  locale,
  dict,
  className,
}: {
  product: CatalogCardProduct;
  locale: Locale;
  dict: Dictionary;
  className?: string;
}) {
  const name = localizedName(locale, product.nameAr, product.nameEn, product.slug);
  const primary = product.images[0];
  const secondary = product.images[1];
  const altFor = (img: { altAr: string; altEn: string }) =>
    localizedName(locale, img.altAr, img.altEn, name);
  const available = product.availability !== "unavailable";
  const category = product.category
    ? localizedName(locale, product.category.nameAr, product.category.nameEn)
    : "";
  const price = Number(product.retailPrice);

  return (
    <article className={cn("group relative", className)}>
      <div className="relative">
        <ProductThumb
          path={primary?.path}
          alt={primary ? altFor(primary) : name}
          plateCaption={dict.catalog.photoCaption}
          className={cn(!available && "opacity-80")}
        />
        {secondary ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[var(--ro-r-xs)] opacity-0 transition-opacity duration-[var(--ro-dur-slow)] ease-[var(--ro-ease-standard)] group-hover:opacity-100"
          >
            <Image
              src={secondary.path}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover"
            />
          </div>
        ) : null}
        {available ? (
          <QuickAddButton
            productId={product.id}
            slug={product.slug}
            name={name}
            price={price}
            currency={product.currency}
            imagePath={primary?.path ?? null}
            label={dict.catalog.quickAdd}
            addedLabel={dict.catalog.quickAdded.replace("{name}", name)}
            className="absolute bottom-3 end-3 z-10"
          />
        ) : null}
      </div>

      <div className="mt-3 space-y-1.5">
        {category ? (
          <p className="ro-type-overline text-ro-muted">{category}</p>
        ) : null}
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-ro-ink transition-colors duration-[var(--ro-dur-fast)] group-hover:text-ro-plum">
          <Link
            href={href(`/product/${product.slug}`, locale)}
            className="outline-offset-4 after:absolute after:inset-0 after:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ro-focus)]"
          >
            {name}
          </Link>
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <PriceBlock
            price={price}
            currency={product.currency}
            locale={locale}
            onRequestLabel={dict.product.priceOnRequest}
          />
          <AvailabilityChip
            availability={product.availability}
            label={dict.product.unavailable}
          />
        </div>
      </div>
    </article>
  );
}
