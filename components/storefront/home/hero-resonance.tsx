"use client";

import Link from "next/link";
import { href } from "@/lib/href";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

/** Compact, ordered commerce hero. Brand mark lives in the header only. */
export function HeroResonance({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
  imageSrc?: string | null;
}) {
  return (
    <section
      className="ro-inverse border-b border-ro-line-on-dark bg-[var(--ro-ink-950)] text-ro-canvas"
      data-hero="commerce"
    >
      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-7 md:grid-cols-12 md:items-center md:gap-8 md:px-6 md:py-9 lg:px-8">
        <div className="space-y-3 md:col-span-8">
          <p className="font-display text-base tracking-[0.22em] md:text-lg">
            {dict.brand}
          </p>
          <h1 className="max-w-2xl font-display text-2xl leading-snug tracking-wide md:text-3xl">
            {dict.home.headline}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--ro-ink-200)]">
            {dict.home.sub}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href={href("/catalog", locale)}
              className="inline-flex h-10 items-center bg-[var(--ro-sand-100)] px-4 text-sm font-semibold !text-[var(--ro-ink-950)] hover:bg-white"
            >
              {dict.home.ctaCatalog}
            </Link>
            <Link
              href={href("/offers", locale)}
              className="inline-flex h-10 items-center border border-[rgba(244,231,216,0.4)] px-4 text-sm font-semibold !text-[var(--ro-sand-100)] hover:border-[var(--ro-sand-100)]"
            >
              {dict.home.ctaOffers}
            </Link>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-2 md:col-span-4">
          {[
            dict.home.principleRare,
            dict.home.principleSelected,
            dict.home.principleAuthentic,
            dict.home.principleConsidered,
          ].map((item, i) => (
            <li
              key={item}
              className="border border-ro-line-on-dark bg-[var(--ro-ink-900)]/80 px-3 py-2.5"
            >
              <p className="text-[0.65rem] text-ro-text-muted">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="text-sm font-medium">{item}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
