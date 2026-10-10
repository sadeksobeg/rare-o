import { notFound } from "next/navigation";
import { getPublishedProductBySlug } from "@/lib/catalog/service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { ProductMedia } from "@/components/storefront/product-media";
import { formatCurrency } from "@/lib/i18n/format";
import { Banner } from "@/components/ui/banner";

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
  const description =
    locale === "ar"
      ? product.descriptionAr || product.descriptionEn
      : product.descriptionEn || product.descriptionAr;
  const specs =
    locale === "ar"
      ? product.specsTextAr || product.specsTextEn
      : product.specsTextEn || product.specsTextAr;

  const available = product.availability === "available";
  const photoCaption =
    locale === "ar" ? "الصورة قيد التصوير" : "Photography in progress";

  const images = product.images.map((img) => ({
    path: img.path,
    alt:
      (locale === "ar" ? img.altAr || img.altEn : img.altEn || img.altAr) ||
      name ||
      product.slug,
  }));

  return (
    <section className="grid gap-8 md:grid-cols-2">
      <ProductMedia
        images={images}
        plateCaption={photoCaption}
        priority
      />
      <div className="space-y-4 md:sticky md:top-24 md:self-start">
        {product.category ? (
          <p className="ro-type-overline text-ro-plum">
            {locale === "ar"
              ? product.category.nameAr
              : product.category.nameEn}
          </p>
        ) : null}
        <h1 className="ro-type-h1">{name || product.slug}</h1>
        <p className="font-display text-2xl tabular-nums">
          {formatCurrency(
            Number(product.retailPrice),
            product.currency,
            locale,
            dict.product.priceOnRequest
          )}
        </p>
        {description ? (
          <p className="text-ro-text-2">{description}</p>
        ) : null}
        {specs ? (
          <div>
            <h2 className="mb-2 text-sm font-semibold tracking-wide text-ro-plum">
              {dict.product.specs}
            </h2>
            <p className="whitespace-pre-wrap text-sm text-ro-muted">{specs}</p>
          </div>
        ) : null}
        {available ? (
          <AddToCartButton
            productId={product.id}
            slug={product.slug}
            name={name || product.slug}
            price={Number(product.retailPrice)}
            currency={product.currency}
            label={dict.product.addToCart}
          />
        ) : (
          <Banner tone="closed">{dict.product.unavailable}</Banner>
        )}
      </div>
    </section>
  );
}
