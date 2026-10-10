import Link from "next/link";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { listPublishedPublicOffers } from "@/lib/offers/service";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function TraderOffersPage() {
  await requireTraderSession();
  const offers = await listPublishedPublicOffers();
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;

  return (
    <section className="space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        {t.offersTitle}
      </h1>
      <p className="text-sm text-ro-muted">{t.offersLead}</p>
      {offers.length === 0 ? (
        <p className="text-ro-muted">{t.offersEmpty}</p>
      ) : (
        <ul className="space-y-4">
          {offers.map((o) => {
            const title =
              locale === "ar"
                ? o.titleAr || o.titleEn
                : o.titleEn || o.titleAr;
            return (
              <li key={o.id} className="border-b border-ro-line pb-4">
                <Link href={`/offers/${o.slug}`} className="text-xl hover:text-ro-purple">
                  {title}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Link href="/offers" className="text-sm text-ro-purple">
        {t.offersOpenPublic}
      </Link>
    </section>
  );
}
