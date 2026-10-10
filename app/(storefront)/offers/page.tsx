import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedPublicOffers } from "@/lib/offers/service";
import { getRequestDictionary } from "@/lib/i18n/server";
import { storefrontMetadata } from "@/lib/seo";
import { href } from "@/lib/href";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getRequestDictionary();
  return storefrontMetadata({
    locale,
    title: `${dict.offers.title} — ${dict.brand}`,
    description: dict.offers.sub,
    path: "/offers",
  });
}

export default async function PublicOffersPage() {
  const offers = await listPublishedPublicOffers();
  const { locale, dict } = await getRequestDictionary();

  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <p className="text-sm tracking-[0.2em] text-ro-muted">{dict.brand}</p>
        <h1 className="text-4xl tracking-wide">{dict.offers.title}</h1>
        <p className="max-w-2xl text-ro-muted">{dict.offers.sub}</p>
      </div>
      {offers.length === 0 ? (
        <p className="text-ro-muted">{dict.offers.empty}</p>
      ) : (
        <ul className="divide-y divide-ro-line border-y border-ro-line">
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
              <li key={o.id} className="py-8">
                <Link
                  href={href(`/offers/${o.slug}`, locale)}
                  className="group block space-y-2"
                >
                  <h2 className="text-2xl tracking-wide group-hover:text-ro-purple">
                    {title}
                  </h2>
                  {summary ? (
                    <p className="max-w-2xl text-sm text-ro-muted line-clamp-3">
                      {summary}
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
