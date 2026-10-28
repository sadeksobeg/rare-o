import { Sparkles } from "lucide-react";
import { Stagger } from "@/components/motion/reveal";
import { PressLink } from "@/components/portal/press-link";
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
    <section className="ro-portal-stagger space-y-6">
      <TraderPageHeader
        title={t.offersTitle}
        description={t.offersLead}
        icon={<Sparkles className="size-5" strokeWidth={2} />}
      />

      {ranked.length === 0 ? (
        <EmptyState
          title={t.offersEmpty}
          body={t.offersLead}
          actionHref="/trader"
          actionLabel={dict.trader.overview}
        />
      ) : (
        <Stagger stepMs={70} className="grid gap-4 sm:grid-cols-2">
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
            return (
              <div key={o.id}>
                <PressLink
                  href={`/trader/offers/${o.slug}`}
                  className="ro-portal-card group block h-full space-y-3 border p-5 transition-[transform,border-color,box-shadow] duration-[var(--ro-dur-fast)] hover:-translate-y-1"
                >
                  <p className="font-display text-xl font-semibold leading-snug group-hover:text-[var(--ro-plum-900)]">
                    {title}
                  </p>
                  {summary ? (
                    <p className="line-clamp-3 text-sm leading-relaxed text-ro-muted">
                      {summary}
                    </p>
                  ) : null}
                  {productName ? (
                    <p className="text-xs font-semibold text-[var(--ro-plum-800)]">
                      {t.offersRelatedProduct}: {productName}
                    </p>
                  ) : null}
                  <span className="inline-flex text-sm font-semibold text-[var(--ro-plum-900)] transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                    {t.openRecord}
                  </span>
                </PressLink>
              </div>
            );
          })}
        </Stagger>
      )}
    </section>
  );
}
