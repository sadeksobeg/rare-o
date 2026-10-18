import Link from "next/link";
import { notFound } from "next/navigation";
import { TraderPageHeader } from "@/components/trader/page-header";
import { ButtonLink } from "@/components/ui/button";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { getPublishedPublicOfferBySlug } from "@/lib/offers/service";
import { getRequestDictionary } from "@/lib/i18n/server";

/**
 * Trader-facing offer detail — stays inside /trader so the portal shell
 * (deals, wholesale, nav) is never replaced by the public storefront.
 */
export default async function TraderOfferDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireTraderSession();
  const { slug } = await params;
  const offer = await getPublishedPublicOfferBySlug(slug);
  if (!offer) notFound();

  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;
  const title =
    locale === "ar"
      ? offer.titleAr || offer.titleEn
      : offer.titleEn || offer.titleAr;
  const summary =
    locale === "ar"
      ? offer.summaryAr || offer.summaryEn
      : offer.summaryEn || offer.summaryAr;
  const productName = offer.product
    ? locale === "ar"
      ? offer.product.nameAr || offer.product.nameEn
      : offer.product.nameEn || offer.product.nameAr
    : null;

  return (
    <section className="ro-portal-stagger space-y-6">
      <Link
        href="/trader/offers"
        className="inline-flex text-sm font-semibold text-[var(--ro-plum-900)] hover:underline"
      >
        ← {t.offersBack}
      </Link>

      <TraderPageHeader title={title} description={t.offersLead} />

      {summary ? (
        <div className="ro-portal-card max-w-2xl whitespace-pre-wrap border p-5 text-base leading-relaxed text-ro-text-2">
          {summary}
        </div>
      ) : null}

      {offer.product && productName ? (
        <div className="ro-portal-card max-w-2xl border p-5">
          <p className="ro-type-overline text-[var(--ro-plum-800)]">
            {t.offersRelatedProduct}
          </p>
          <p className="mt-2 font-display text-xl font-semibold">{productName}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/trader/deals/new" variant="primary">
          {t.offersStartDeal}
        </ButtonLink>
        <ButtonLink href="/trader/offers" variant="secondary">
          {t.offersBack}
        </ButtonLink>
      </div>
    </section>
  );
}
