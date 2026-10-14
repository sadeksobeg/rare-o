"use client";

import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { href } from "@/lib/href";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Hero §1 — gallery stage from brand concept photo + UI overlay.
 * Accents: plum (brand), never gold.
 */
export function HeroResonance({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
  imageSrc?: string | null;
}) {
  const isAr = locale === "ar";

  const pillars = [
    dict.home.principleRare,
    dict.home.principleSelected,
    dict.home.principleAuthentic,
  ];

  return (
    <section
      className="relative isolate min-h-[100svh] overflow-hidden bg-black text-[var(--ro-sand-100)]"
      data-hero="resonance"
    >
      {/* Full-bleed stage photograph (oud + sculpture + pedestal) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/brand/hero-stage-oud.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_42%] md:object-center"
          quality={90}
        />
        {/* Keep subject readable; lift right for copy */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: [
              "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 38%, rgba(0,0,0,0.2) 55%, rgba(6,4,10,0.72) 78%, rgba(6,4,10,0.88) 100%)",
              "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 22%, transparent 78%, rgba(0,0,0,0.55) 100%)",
              "radial-gradient(ellipse 50% 60% at 42% 48%, transparent 30%, rgba(50,16,79,0.22) 100%)",
            ].join(", "),
          }}
        />
      </div>

      {/* Physical LTR grid: pillars left · stage center · copy right */}
      <div
        dir="ltr"
        className="relative z-10 mx-auto grid min-h-[100svh] max-w-[1440px] grid-cols-1 items-center px-5 pb-16 pt-[5.75rem] md:grid-cols-12 md:px-8 md:pb-20 md:pt-28 lg:px-12"
      >
        {/* Left pillars — vertical poetry */}
        <aside
          className="hidden md:col-span-2 md:flex md:flex-col md:justify-center md:gap-10"
          aria-label={dict.home.principlesEyebrow}
        >
          {pillars.map((label, i) => (
            <p
              key={label}
              lang={locale}
              dir={isAr ? "rtl" : "ltr"}
              className={cn(
                "ro-hero-line-a font-display text-sm tracking-wide text-[var(--ro-plum-300)] md:text-base",
                "border-s border-[color-mix(in_srgb,var(--ro-plum-300)_45%,transparent)] ps-4",
                i === 0 && "[animation-delay:0.35s]",
                i === 1 && "[animation-delay:0.5s]",
                i === 2 && "[animation-delay:0.65s]"
              )}
            >
              {label}
            </p>
          ))}
        </aside>

        {/* Center — breathing room over the photograph subject */}
        <div className="pointer-events-none hidden md:col-span-5 md:block" aria-hidden />

        {/* Right — copy + CTAs */}
        <div
          data-hero-copy
          lang={locale}
          dir={isAr ? "rtl" : "ltr"}
          className={cn(
            "relative z-20 flex flex-col justify-center space-y-7 md:col-span-5",
            isAr ? "text-start" : "text-left"
          )}
          style={{ unicodeBidi: "isolate" }}
        >
          <div className="ro-hero-line-a space-y-3">
            <p
              className={cn(
                "ro-type-overline text-[var(--ro-plum-300)]",
                isAr ? "tracking-[0.22em]" : "tracking-[0.36em]"
              )}
            >
              RARE OUD
            </p>
            <div className="h-px w-14 bg-[color-mix(in_srgb,var(--ro-plum-300)_70%,transparent)]" />
          </div>

          <h1
            className={cn(
              "ro-hero-line-b ro-type-display-xl overflow-visible text-balance",
              "text-[color-mix(in_srgb,var(--ro-sand-100)_90%,var(--ro-plum-300))]",
              isAr ? "max-w-xl" : "max-w-[12ch] tracking-[-0.02em]"
            )}
          >
            {isAr ? (
              dict.home.headline
            ) : (
              <>
                <span className="block">A rare oud</span>
                <span className="block text-[var(--ro-plum-300)]">made to last</span>
              </>
            )}
          </h1>

          <p
            className={cn(
              "ro-hero-line-c leading-relaxed text-[color-mix(in_srgb,var(--ro-sand-100)_72%,transparent)]",
              isAr
                ? "max-w-md text-base md:text-lg"
                : "max-w-[34ch] text-[1.05rem] md:text-[1.12rem] md:leading-[1.7]"
            )}
          >
            {dict.home.sub}
          </p>

          <div
            className={cn(
              "ro-hero-line-d flex flex-wrap items-center gap-3 pt-1 sm:gap-4",
              !isAr && "flex-row"
            )}
          >
            <ButtonLink
              href={href("/catalog", locale)}
              variant="inverse-primary"
              size="lg"
              ripple
              className="rounded-full !bg-[var(--ro-sand-100)] !text-[var(--ro-ink-950)] hover:!bg-white"
            >
              {dict.home.ctaCatalog}
            </ButtonLink>
            <ButtonLink
              href={href("/contact", locale)}
              variant="inverse-secondary"
              size="lg"
              className="rounded-full !border-[var(--ro-plum-300)] !bg-transparent !text-[var(--ro-sand-100)] hover:!border-[var(--ro-plum-100)] hover:!bg-[color-mix(in_srgb,var(--ro-plum-700)_40%,transparent)]"
            >
              {dict.nav.contact}
            </ButtonLink>
          </div>

          {/* Mobile pillars */}
          <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-4 md:hidden">
            {pillars.map((label) => (
              <li
                key={label}
                className="font-display text-sm text-[var(--ro-plum-300)]"
              >
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
