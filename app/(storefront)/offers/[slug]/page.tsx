import Link from "next/link";
import { getPublishedPublicOfferBySlug } from "@/lib/offers/service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { storefrontMetadata } from "@/lib/seo";
import { href } from "@/lib/href";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await getRequestDictionary();
  const offer = await getPublishedPublicOfferBySlug(slug);
  if (!offer) {
    return storefrontMetadata({
      locale,
      title: `${dict.common.errorNotFound} — ${dict.brand}`,
      description: dict.offers.sub,
      path: `/offers/${slug}`,
      noIndex: true,
    });
  }
  const title =
    (locale === "ar"
      ? offer.titleAr || offer.titleEn
      : offer.titleEn || offer.titleAr) || dict.offers.title;
  const summary =
    (locale === "ar"
      ? offer.summaryAr || offer.summaryEn
      : offer.summaryEn || offer.summaryAr
    )?.trim() || dict.offers.sub;
  return storefrontMetadata({
    locale,
    title: `${title} — ${dict.brand}`,
    description: summary.slice(0, 160),
    path: `/offers/${offer.slug}`,
  });
}

export default async function PublicOfferDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const offer = await getPublishedPublicOfferBySlug(slug);
  if (!offer) notFound();

  const { locale, dict } = await getRequestDictionary();
  const title =
    locale === "ar" ? offer.titleAr || offer.titleEn : offer.titleEn || offer.titleAr;
  const summary =
    locale === "ar"
      ? offer.summaryAr || offer.summaryEn
      : offer.summaryEn || offer.summaryAr;

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <Link
        href={href("/offers", locale)}
        className="text-sm text-ro-muted hover:text-ro-purple"
      >
        ← {dict.offers.back}
      </Link>
      <header className="space-y-3 border-b border-ro-line pb-8">
        <p className="text-sm tracking-[0.2em] text-ro-muted">{dict.brand}</p>
        <h1 className="text-4xl tracking-wide">{title}</h1>
      </header>
      {summary ? (
        <div className="whitespace-pre-wrap text-base leading-relaxed text-ro-muted">
          {summary}
        </div>
      ) : null}
      {offer.product ? (
        <div className="border-t border-ro-line pt-6 text-sm">
          <p className="text-ro-muted">{dict.offers.relatedProduct}</p>
          <Link
            href={href(`/product/${offer.product.slug}`, locale)}
            className="mt-1 inline-block text-ro-purple"
          >
            {locale === "ar"
              ? offer.product.nameAr || offer.product.nameEn
              : offer.product.nameEn || offer.product.nameAr}
          </Link>
        </div>
      ) : null}
    </article>
  );
}
