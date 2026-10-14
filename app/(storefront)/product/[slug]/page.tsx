import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  getPublishedProductBySlug,
  listRelatedPublishedProducts,
} from "@/lib/catalog/service";
import { parseSpecs } from "@/lib/catalog/specs";
import { getRequestDictionary } from "@/lib/i18n/server";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { HandoffExplainer } from "@/components/storefront/handoff-explainer";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { StickyCtaBar } from "@/components/storefront/sticky-cta-bar";
import { AvailabilityChip } from "@/components/storefront/catalog/availability-chip";
import { PriceBlock } from "@/components/storefront/catalog/price-block";
import { ProductBadges } from "@/components/storefront/catalog/product-badges";
import { ProductGrid } from "@/components/storefront/catalog/product-grid";
import { SpecTable } from "@/components/storefront/catalog/spec-table";
import { Button, ButtonLink } from "@/components/ui/button";
import { href } from "@/lib/href";
import { localizedName } from "@/lib/utils";
import {
  absoluteUrl,
  jsonLdString,
  productJsonLd,
  storefrontMetadata,
} from "@/lib/seo";

const SHORT_DESCRIPTOR_MAX = 160;

function pickDescription(
  locale: "ar" | "en",
  product: { descriptionAr: string | null; descriptionEn: string | null }
) {
  return locale === "ar"
    ? product.descriptionAr || product.descriptionEn
    : product.descriptionEn || product.descriptionAr;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await getRequestDictionary();
  const product = await getPublishedProductBySlug(slug);
  if (!product) {
    return storefrontMetadata({
      locale,
      title: `${dict.common.errorNotFound} — ${dict.brand}`,
      description: dict.seo.productFallbackDescription,
      path: `/product/${slug}`,
      noIndex: true,
    });
  }
  const name =
    (locale === "ar"
      ? product.nameAr || product.nameEn
      : product.nameEn || product.nameAr) || product.slug;
  const description =
    pickDescription(locale, product)?.trim() ||
    dict.seo.productFallbackDescription;
  const base = storefrontMetadata({
    locale,
    title: `${name} — ${dict.brand}`,
    description: description.slice(0, 160),
    path: `/product/${product.slug}`,
  });
  const image = product.images[0];
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      ...(image ? { images: [{ url: absoluteUrl(image.path) }] } : {}),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) notFound();

  const { locale, dict } = await getRequestDictionary();
  const name =
    locale === "ar"
      ? product.nameAr || product.nameEn
      : product.nameEn || product.nameAr;
  const description = pickDescription(locale, product);
  const specs =
    locale === "ar"
      ? product.specsTextAr || product.specsTextEn
      : product.specsTextEn || product.specsTextAr;

  const available = product.availability === "available";

  const images = product.images.map((img) => ({
    path: img.path,
    kind: img.kind,
    alt:
      (locale === "ar" ? img.altAr || img.altEn : img.altEn || img.altAr) ||
      name ||
      product.slug,
  }));

  const priceNumber = Number(product.retailPrice);
  const jsonLd = productJsonLd({
    name: name || product.slug,
    description: description || undefined,
    images: product.images.map((img) => absoluteUrl(img.path)),
    price: Number.isFinite(priceNumber) ? priceNumber : null,
    // schema.org expects ISO 4217; skip non-ISO fixture codes.
    currency: /^[A-Z]{3}$/.test(product.currency) ? product.currency : null,
    url: absoluteUrl(href(`/product/${product.slug}`, locale)),
    available,
  });

  const displayName = name || product.slug;
  const categoryName = product.category
    ? localizedName(locale, product.category.nameAr, product.category.nameEn)
    : "";
  const descriptionText = description?.trim() ?? "";
  const longDescription = descriptionText.length > SHORT_DESCRIPTOR_MAX;
  const keySpecs = parseSpecs(specs).rows.slice(0, 4);
  const related = await listRelatedPublishedProducts(
    product.categoryId,
    product.id
  );

  return (
    <div
      className={`space-y-12 md:space-y-16${available ? " pb-20 md:pb-0" : ""}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />

      <nav aria-label={dict.product.breadcrumb}>
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ro-muted">
          <li>
            <Link href={href("/", locale)} className="hover:text-ro-ink">
              {dict.nav.home}
            </Link>
          </li>
          <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
          <li>
            <Link href={href("/catalog", locale)} className="hover:text-ro-ink">
              {dict.nav.catalog}
            </Link>
          </li>
          <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
          <li aria-current="page" className="text-ro-ink">
            {displayName}
          </li>
        </ol>
      </nav>

      <section className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="relative min-w-0 lg:col-span-7">
          <ProductBadges
            product={product}
            locale={locale}
            className="z-20"
          />
          <ProductGallery
            images={images}
            plateCaption={dict.catalog.photoCaption}
            priority
            labels={{
              gallery: dict.product.galleryLabel,
              showImage: dict.product.galleryShowImage,
              enlarge: dict.product.galleryEnlarge,
              prev: dict.product.galleryPrev,
              next: dict.product.galleryNext,
              close: dict.common.close,
              counter: dict.product.galleryCounter,
            }}
          />
        </div>
        <div className="space-y-5 lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
          {categoryName ? (
            <p className="ro-type-overline text-ro-plum">{categoryName}</p>
          ) : null}
          <h1 className="ro-type-h1">{displayName}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <PriceBlock
              size="pdp"
              price={priceNumber}
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
            <AvailabilityChip
              size="md"
              availability={product.availability}
              label={dict.product.unavailable}
            />
          </div>
          {descriptionText ? (
            <p className="text-ro-text-2">
              {longDescription
                ? `${descriptionText.slice(0, SHORT_DESCRIPTOR_MAX).trimEnd()}…`
                : descriptionText}
            </p>
          ) : null}
          {keySpecs.length > 0 ? (
            <dl className="border-t border-ro-border">
              {keySpecs.map((row, i) => (
                <div
                  key={`${row.label}-${i}`}
                  className="flex items-baseline justify-between gap-6 border-b border-ro-border py-2.5"
                >
                  <dt className="text-sm text-ro-muted">{row.label}</dt>
                  <dd className="text-sm font-medium text-ro-ink text-end">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          {available ? (
            <div id="pdp-cta">
              <AddToCartButton
                variant="pdp"
                productId={product.id}
                slug={product.slug}
                name={displayName}
                price={priceNumber}
                currency={product.currency}
                imagePath={images[0]?.path ?? null}
                label={dict.product.addToCart}
                addedLabel={dict.product.added}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <Button size="lg" className="w-full" disabled>
                {dict.product.addToCart}
              </Button>
              <p className="text-sm text-ro-text-2">
                {dict.product.unavailableReason}
              </p>
              <ButtonLink
                href={href("/contact", locale)}
                variant="secondary"
                size="lg"
                className="w-full"
              >
                {dict.product.contactUs}
              </ButtonLink>
            </div>
          )}
          <HandoffExplainer dict={dict} compact />
        </div>
      </section>

      {longDescription ? (
        <section className="max-w-[680px] space-y-4">
          <h2 className="ro-type-h2">{dict.product.description}</h2>
          <p className="whitespace-pre-line leading-relaxed text-ro-text-2">
            {descriptionText}
          </p>
        </section>
      ) : null}

      <SpecTable text={specs} heading={dict.product.specs} />

      {related.length > 0 ? (
        <section className="space-y-6">
          <h2 className="ro-type-h2">{dict.product.related}</h2>
          <ProductGrid products={related} locale={locale} dict={dict} />
        </section>
      ) : null}

      {available ? (
        <StickyCtaBar watchId="pdp-cta">
          <PriceBlock
            size="pdp"
            className="text-xl md:text-xl"
            price={priceNumber}
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
          />
          <div className="min-w-0 flex-1 max-w-[14rem]">
            <AddToCartButton
              variant="pdp"
              productId={product.id}
              slug={product.slug}
              name={displayName}
              price={priceNumber}
              currency={product.currency}
              imagePath={images[0]?.path ?? null}
              label={dict.product.addToCart}
              addedLabel={dict.product.added}
            />
          </div>
        </StickyCtaBar>
      ) : null}
    </div>
  );
}
