import Link from "next/link";
import { TraderPageHeader } from "@/components/trader/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { listPublishedPublicOffers } from "@/lib/offers/service";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function TraderOffersPage() {
  await requireTraderSession();
  const offers = await listPublishedPublicOffers();
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;

  return (
    <section className="ro-portal-stagger space-y-6 p-5 sm:p-8 md:p-10">
      <TraderPageHeader title={t.offersTitle} description={t.offersLead} />

      {offers.length === 0 ? (
        <EmptyState
          title={t.offersEmpty}
          body={t.offersLead}
          actionHref="/trader"
          actionLabel={dict.trader.overview}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {offers.map((o) => {
            const title =
              locale === "ar"
                ? o.titleAr || o.titleEn
                : o.titleEn || o.titleAr;
            const summary =
              locale === "ar"
                ? o.summaryAr || o.summaryEn
                : o.summaryEn || o.summaryAr;
            return (
              <li key={o.id}>
                <Link
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
                  <span className="inline-flex text-sm font-semibold text-[var(--ro-plum-900)] transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                    {t.openRecord}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
