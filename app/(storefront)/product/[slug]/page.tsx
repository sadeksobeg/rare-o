import { notFound } from "next/navigation";
import { getPublishedProductBySlug } from "@/lib/catalog/service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) notFound();

  const { locale, dict } = await getRequestDictionary();
  const name = locale === "ar" ? product.nameAr || product.nameEn : product.nameEn || product.nameAr;
  const description =
    locale === "ar"
      ? product.descriptionAr || product.descriptionEn
      : product.descriptionEn || product.descriptionAr;
  const specs =
    locale === "ar"
      ? product.specsTextAr || product.specsTextEn
      : product.specsTextEn || product.specsTextAr;

  const available = product.availability === "available";

  return (
    <section className="grid gap-8 md:grid-cols-2">
      <div className="min-h-80 border border-ro-line bg-ro-surface" />
      <div className="space-y-4">
        <h1 className="text-3xl">{name || product.slug}</h1>
        <p className="text-lg">
          {Number(product.retailPrice).toLocaleString(locale)} {product.currency}
        </p>
        {description ? <p className="text-ro-muted">{description}</p> : null}
        {specs ? (
          <div>
            <h2 className="mb-2 text-sm tracking-wide text-ro-purple">
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
          <p className="text-ro-muted">{dict.product.unavailable}</p>
        )}
      </div>
    </section>
  );
}
