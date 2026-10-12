import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { href } from "@/lib/href";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { localizedName } from "@/lib/utils";

export function FeaturedOfferModule({
  offer,
  dict,
  locale,
}: {
  offer: {
    slug: string;
    titleAr: string;
    titleEn: string;
    summaryAr: string;
    summaryEn: string;
  };
  dict: Dictionary;
  locale: Locale;
}) {
  const title = localizedName(
    locale,
    offer.titleAr,
    offer.titleEn,
    offer.slug
  );
  const summary = localizedName(locale, offer.summaryAr, offer.summaryEn);

  return (
    <article className="flex h-full flex-col justify-between gap-3 border border-ro-line bg-[var(--ro-ink-950)] p-4 text-ro-canvas md:p-5">
      <div className="space-y-2">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--ro-amber-400)]">
          {dict.home.featuredOfferEyebrow}
        </p>
        <h2 className="font-display text-xl tracking-wide md:text-2xl">
          <Link
            href={href(`/offers/${offer.slug}`, locale)}
            className="hover:underline"
          >
            {title}
          </Link>
        </h2>
        {summary ? (
          <p className="line-clamp-3 text-sm text-ro-text-2">{summary}</p>
        ) : null}
      </div>
      <Link
        href={href(`/offers/${offer.slug}`, locale)}
        className="inline-flex items-center gap-2 self-start text-sm font-semibold underline-offset-4 hover:underline"
      >
        {dict.home.featuredOfferCta}
        <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
      </Link>
    </article>
  );
}
