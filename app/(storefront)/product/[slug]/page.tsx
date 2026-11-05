import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  getPublishedProductBySlug,
  listRelatedPublishedProducts,
} from "@/lib/catalog/service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { HandoffExplainer } from "@/components/storefront/handoff-explainer";
import { ProductAPlus } from "@/components/storefront/product-a-plus";
import { ProductBuyBox } from "@/components/storefront/product-buy-box";
import {
  parseFeatureLines,
  ProductFeatureBullets,
} from "@/components/storefront/product-feature-bullets";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { StickyCtaBar } from "@/components/storefront/sticky-cta-bar";
import { AvailabilityChip } from "@/components/storefront/catalog/availability-chip";
import { PriceBlock } from "@/components/storefront/catalog/price-block";
import { ProductBadges } from "@/components/storefront/catalog/product-badges";
import { ProductGrid } from "@/components/storefront/catalog/product-grid";
import { OudSpecGallery } from "@/components/storefront/catalog/oud-spec-gallery";
import { SpecTable } from "@/components/storefront/catalog/spec-table";
import { Button, ButtonLink } from "@/components/ui/button";
import { href } from "@/lib/href";
import { localizedName } from "@/lib/utils";
import {
  absoluteUrl,
  breadcrumbJsonLd,
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
      localizedName(locale, img.altAr, img.altEn) ||
      name ||
      product.slug,
  }));

  const priceNumber = Number(product.retailPrice);
  const jsonLd = productJsonLd({
    name: name || product.slug,
    description: description || undefined,
    images: product.images
      .filter((img) => img.kind !== "audio")
      .map((img) => absoluteUrl(img.path)),
    price: Number.isFinite(priceNumber) ? priceNumber : null,
    currency:
      product.currency && /^[A-Z]{3}$/.test(product.currency)
        ? product.currency
        : null,
    url: absoluteUrl(href(`/product/${product.slug}`, locale)),
    available,
  });

  const displayName = name || product.slug;
  const categoryName = product.category
    ? localizedName(locale, product.category.nameAr, product.category.nameEn)
    : "";
  const descriptionText = description?.trim() ?? "";
  const longDescription = descriptionText.length > SHORT_DESCRIPTOR_MAX;
  const related = await listRelatedPublishedProducts(
    product.categoryId,
    product.id
  );

  const featureItems = [
    ...parseFeatureLines(specs),
    ...parseFeatureLines(descriptionText),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const aPlusBlocks = [
    {
      title: dict.product.craftStory,
      body: dict.product.craftStoryBody,
      imageSrc: "/brand/instruments/oud-workshop.jpg",
      imageAlt: dict.product.craftStory,
    },
    {
      title: dict.product.soundStory,
      body: dict.product.soundStoryBody,
      imageSrc: "/brand/instruments/oud-strings-close.jpg",
      imageAlt: dict.product.soundStory,
    },
  ];

  return (
    <div
      className={`space-y-12 md:space-y-16${available ? " pb-20 md:pb-0" : ""}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString(
            breadcrumbJsonLd([
              { name: dict.nav.home, path: href("/", locale) },
              { name: dict.nav.catalog, path: href("/catalog", locale) },
              ...(categoryName && product.category?.slug
                ? [
                    {
                      name: categoryName,
                      path: href(
                        `/catalog?category=${product.category.slug}`,
                        locale
                      ),
                    },
                  ]
                : []),
              {
                name: displayName,
                path: href(`/product/${product.slug}`, locale),
              },
            ])
          ),
        }}
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
          {categoryName && product.category?.slug ? (
            <>
              <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
              <li>
                <Link
                  href={href(`/catalog?category=${product.category.slug}`, locale)}
                  className="hover:text-ro-ink"
                >
                  {categoryName}
                </Link>
              </li>
            </>
          ) : null}
          <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
          <li aria-current="page" className="max-w-[14rem] truncate text-ro-ink">
            {displayName}
          </li>
        </ol>
      </nav>

      <section className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
        <div className="relative min-w-0 lg:col-span-7">
          <ProductBadges
            product={{
              ...product,
              categorySlug: product.category?.slug,
            }}
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
          <h1 className="ro-type-h1 leading-tight">{displayName}</h1>

          <ProductBuyBox
            trust={[
              { icon: "shield", label: dict.product.trustNoPayment },
              { icon: "package", label: dict.product.trustHandoff },
              { icon: "truck", label: dict.product.trustUnique },
              { icon: "whatsapp", label: dict.product.trustWhatsApp },
            ]}
          >
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
              <p className="text-sm leading-relaxed text-ro-text-2">
                {longDescription
                  ? `${descriptionText.slice(0, SHORT_DESCRIPTOR_MAX).trimEnd()}…`
                  : descriptionText}
              </p>
            ) : null}

            <ProductFeatureBullets
              title={dict.product.featureBullets}
              items={featureItems}
            />

            {available ? (
              <div id="pdp-cta" className="space-y-3">
                <AddToCartButton
                  variant="pdp"
                  productId={product.id}
                  slug={product.slug}
                  name={displayName}
                  price={priceNumber}
                  currency={product.currency ?? ""}
                  imagePath={images[0]?.path ?? null}
                  label={dict.product.addToCart}
                  addedLabel={dict.product.added}
                />
                <ButtonLink
                  href={href("/cart", locale)}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  {dict.product.viewCart}
                </ButtonLink>
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
          </ProductBuyBox>

          <HandoffExplainer dict={dict} compact />
        </div>
      </section>

      {longDescription ? (
        <section className="max-w-[720px] space-y-4">
          <h2 className="ro-type-h2">{dict.product.description}</h2>
          <p className="whitespace-pre-line leading-relaxed text-ro-text-2">
            {descriptionText}
          </p>
        </section>
      ) : null}

      <OudSpecGallery specs={product.oudSpecs} locale={locale} dict={dict} />

      <SpecTable text={specs} heading={dict.product.extras} />

      <ProductAPlus heading={dict.product.aboutThisPiece} blocks={aPlusBlocks} />

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
              currency={product.currency ?? ""}
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
