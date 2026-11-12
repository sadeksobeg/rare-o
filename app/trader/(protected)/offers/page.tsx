import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Stagger } from "@/components/motion/reveal";
import { TraderPageHeader } from "@/components/trader/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { prisma } from "@/lib/db/prisma";
import { listPublishedPublicOffers } from "@/lib/offers/service";
import {
  parseInterestSlugs,
  rankOffersByInterest,
} from "@/lib/offers/rank-by-interest";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function TraderOffersPage() {
  const session = await requireTraderSession();
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;
  const [offers, trader] = await Promise.all([
    listPublishedPublicOffers(),
    prisma.traderAccount.findUnique({
      where: { id: session.sub },
      select: { interestCategorySlugs: true },
    }),
  ]);
  const ranked = rankOffersByInterest(
    offers,
    parseInterestSlugs(trader?.interestCategorySlugs)
  );

  return (
    <section className="space-y-6 pb-[calc(68px+env(safe-area-inset-bottom,0px)+24px)] min-[901px]:pb-0">
      <TraderPageHeader
        title={t.offersTitle}
        description={t.offersLead}
        icon={<Sparkles className="size-5" strokeWidth={1.5} />}
      />

      {ranked.length === 0 ? (
        <EmptyState
          title={t.offersEmpty}
          body={t.offersLead}
          actionHref="/trader"
          actionLabel={dict.trader.overview}
        />
      ) : (
        <Stagger
          stepMs={70}
          className="grid grid-cols-1 items-start gap-4 min-[640px]:grid-cols-2"
        >
          {ranked.map((o) => {
            const title =
              locale === "ar"
                ? o.titleAr || o.titleEn
                : o.titleEn || o.titleAr;
            const summary =
              locale === "ar"
                ? o.summaryAr || o.summaryEn
                : o.summaryEn || o.summaryAr;
            const productName = o.product
              ? locale === "ar"
                ? o.product.nameAr || o.product.nameEn
                : o.product.nameEn || o.product.nameAr
              : null;
            const imagePath = o.product?.images?.[0]?.path ?? null;
            const dealHref = `/trader/deals/new?title=${encodeURIComponent(
              (title || o.slug).slice(0, 200)
            )}`;
            return (
              <article
                key={o.id}
                className="rad-card flex w-full flex-col overflow-hidden self-start"
              >
                {/* Padding-bottom 75% locks 4:3 even when abspos img has a tall intrinsic size. */}
                <div
                  className="relative w-full overflow-hidden bg-[color:var(--rad-surface3)]"
                  data-offer-media
                  style={{ height: 0, paddingBottom: "75%" }}
                >
                  {imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePath}
                      alt=""
                      className="absolute inset-0 size-full object-contain object-center"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--rad-surface2)] text-xs text-[color:var(--rad-tx3)]">
                      RARE OUD
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h2 className="text-xl font-semibold leading-snug text-[color:var(--rad-tx)]" style={{ fontFamily: "var(--rad-font, inherit)" }}>
                    {title}
                  </h2>
                  {summary ? (
                    <p className="line-clamp-3 text-sm leading-relaxed text-[color:var(--rad-tx3)]">
                      {summary}
                    </p>
                  ) : null}
                  {productName ? (
                    <p className="text-xs font-semibold text-[color:var(--rad-ac)]">
                      {t.offersRelatedProduct}: {productName}
                    </p>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <Link
                      href={`/trader/offers/${o.slug}`}
                      className="rad-btn rad-gh rad-sm"
                    >
                      {t.offersViewDetails}
                    </Link>
                    <Link href={dealHref} className="rad-btn rad-pri rad-sm">
                      {t.offersStartDeal}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </Stagger>
      )}
    </section>
  );
}
