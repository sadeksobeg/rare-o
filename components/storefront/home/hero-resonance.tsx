"use client";

import { HeroOudField } from "@/components/brand/hero-oud-field";
import { HeroFeatureRail } from "@/components/storefront/home/hero-feature-rail";
import { ButtonLink } from "@/components/ui/button";
import { href } from "@/lib/href";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Hero §1 — single moving oud (parallax + breathe) on black atelier stage.
 * Accents: plum (brand). No stage photograph / no Higgsfield assets.
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

  return (
    <section
      className="relative isolate min-h-[100svh] overflow-hidden bg-black text-[var(--ro-sand-100)]"
      data-hero="resonance"
    >
      {/* Soft plum + amber atelier depth (design-lab port accents) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: [
            "radial-gradient(ellipse 55% 70% at 38% 55%, rgba(82,39,124,0.34) 0%, transparent 62%)",
            "radial-gradient(ellipse 40% 50% at 70% 30%, rgba(50,16,79,0.22) 0%, transparent 55%)",
            "radial-gradient(ellipse 35% 40% at 78% 78%, rgba(184,134,63,0.12) 0%, transparent 60%)",
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 18%, transparent 78%, rgba(0,0,0,0.55) 100%)",
          ].join(", "),
        }}
      />

      {/* Physical LTR: features · oud · copy */}
      <div
        dir="ltr"
        className="relative z-10 mx-auto grid min-h-[100svh] max-w-[1440px] grid-cols-1 items-center gap-8 px-5 pb-16 pt-[5.75rem] md:grid-cols-12 md:gap-4 md:px-8 md:pb-20 md:pt-28 lg:px-12"
      >
        <aside className="hidden md:col-span-2 md:flex md:justify-center">
          <HeroFeatureRail dict={dict} locale={locale} />
        </aside>

        <div className="relative z-10 order-1 h-[min(58svh,28rem)] w-full md:order-none md:col-span-5 md:h-[min(78svh,40rem)]">
          <HeroOudField trackTarget="section" className="h-full" />
        </div>

        <div
          data-hero-copy
          lang={locale}
          dir={isAr ? "rtl" : "ltr"}
          className={cn(
            "relative z-20 order-2 flex flex-col justify-center space-y-7 md:order-none md:col-span-5",
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
                <span className="block text-[var(--ro-plum-300)]">
                  made to last
                </span>
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
              "ro-hero-line-d flex flex-wrap items-center gap-3 pt-1 sm:gap-4"
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

          <div className="pt-2 md:hidden">
            <HeroFeatureRail dict={dict} locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}
