import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Rings } from "@/components/brand";
import { Reveal } from "@/components/storefront/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
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
    locale === "ar"
      ? offer.titleAr || offer.titleEn
      : offer.titleEn || offer.titleAr;
  const summary =
    locale === "ar"
      ? offer.summaryAr || offer.summaryEn
      : offer.summaryEn || offer.summaryAr;

  return (
    <article className="space-y-0">
      <section className="relative overflow-hidden border-b border-ro-line bg-[var(--ro-ink-950)] text-ro-canvas">
        <Rings className="pointer-events-none absolute -end-24 -top-28 size-80 text-ro-canvas opacity-[0.08]" />
        <div className="relative mx-auto max-w-3xl space-y-6 px-5 py-14 md:px-8 md:py-20">
          <Link
            href={href("/offers", locale)}
            className="inline-flex items-center gap-2 text-sm text-ro-text-muted hover:text-ro-canvas"
          >
            <ArrowRight className="size-3.5 rotate-180 rtl:rotate-0" aria-hidden />
            {dict.offers.back}
          </Link>
          <p className="ro-type-overline tracking-[0.28em] text-ro-text-muted">
            {dict.offers.eyebrow}
          </p>
          <h1 className="font-display text-4xl tracking-wide md:text-5xl">
            {title}
          </h1>
        </div>
      </section>

      <Reveal>
        <div className="mx-auto max-w-3xl space-y-10 px-5 py-12 md:px-8 md:py-16">
          {summary ? (
            <div className="whitespace-pre-wrap text-base leading-relaxed text-ro-text-2 md:text-lg">
              {summary}
            </div>
          ) : null}
          {offer.product ? (
            <div className="border border-ro-line bg-ro-paper p-6 md:p-8">
              <p className="ro-type-overline text-ro-plum">
                {dict.offers.relatedProduct}
              </p>
              <p className="mt-3 font-display text-2xl tracking-wide">
                {locale === "ar"
                  ? offer.product.nameAr || offer.product.nameEn
                  : offer.product.nameEn || offer.product.nameAr}
              </p>
              <div className="mt-6">
                <ButtonLink
                  href={href(`/product/${offer.product.slug}`, locale)}
                  variant="primary"
                  size="sm"
                >
                  {dict.home.viewProduct}
                </ButtonLink>
              </div>
            </div>
          ) : (
            <ButtonLink href={href("/catalog", locale)} variant="secondary">
              {dict.nav.catalog}
            </ButtonLink>
          )}
        </div>
      </Reveal>
    </article>
  );
}
