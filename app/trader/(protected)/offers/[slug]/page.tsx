import Link from "next/link";
import { Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { TraderPageHeader } from "@/components/trader/page-header";
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
    <section className="space-y-6">
      <TraderPageHeader
        title={title}
        description={t.offersLead}
        icon={<Sparkles className="size-5" strokeWidth={1.5} />}
        backHref="/trader/offers"
        backLabel={t.offersBack}
      />

      {summary ? (
        <Reveal>
          <div className="rad-card max-w-2xl whitespace-pre-wrap p-5 text-base leading-relaxed text-[color:var(--rad-tx2)]">
            {summary}
          </div>
        </Reveal>
      ) : null}

      {offer.product && productName ? (
        <div className="rad-card max-w-2xl p-5">
          <p className="ro-type-overline text-[color:var(--rad-ac)]">
            {t.offersRelatedProduct}
          </p>
          <p className="mt-2 text-xl font-semibold text-[color:var(--rad-tx)]" style={{ fontFamily: "var(--rad-font, inherit)" }}>
            {productName}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/trader/deals/new?title=${encodeURIComponent(title)}`}
          className="rad-btn rad-pri"
        >
          {t.offersStartDeal}
        </Link>
        <Link href="/trader/offers" className="rad-btn rad-gh">
          {t.offersBack}
        </Link>
      </div>
    </section>
  );
}
