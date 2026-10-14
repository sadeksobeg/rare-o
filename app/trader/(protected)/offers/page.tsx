import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { href } from "@/lib/href";
import { listPublishedPublicOffers } from "@/lib/offers/service";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function TraderOffersPage() {
  await requireTraderSession();
  const offers = await listPublishedPublicOffers();
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t.offersTitle}
        </h1>
        <p className="max-w-2xl text-sm text-ro-muted">{t.offersLead}</p>
      </header>

      {offers.length === 0 ? (
        <EmptyState
          title={t.offersEmpty}
          body={t.offersLead}
          actionHref={href("/offers", locale)}
          actionLabel={t.offersOpenPublic}
        />
      ) : (
        <ul className="divide-y divide-ro-line border border-ro-line">
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
              <li key={o.id} className="space-y-2 p-4">
                <Link
                  href={href(`/offers/${o.slug}`, locale)}
                  className="font-display text-xl font-semibold hover:text-ro-plum"
                >
                  {title}
                </Link>
                {summary ? (
                  <p className="text-sm text-ro-muted line-clamp-2">{summary}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href={href("/offers", locale)}
        className="inline-flex text-sm font-semibold text-ro-plum hover:underline"
      >
        {t.offersOpenPublic}
      </Link>
    </section>
  );
}
