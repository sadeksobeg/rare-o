"use client";

import Image from "next/image";
import { Rings, Grain, Axis } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";
import { EDITORIAL } from "@/lib/brand/editorial";
import { href } from "@/lib/href";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/components/storefront/motion/use-reduced-motion";
import { useEffect, useState } from "react";

/**
 * SF-01 H1 — Quiet luxury hero aligned to brand board + plan 03.
 */
export function HeroResonance({
  dict,
  locale,
  imageSrc = EDITORIAL.instrumentDark,
}: {
  dict: Dictionary;
  locale: Locale;
  imageSrc?: string | null;
}) {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const hasImage = Boolean(imageSrc);

  return (
    <section
      className="ro-inverse relative -mt-[4.75rem] min-h-[max(620px,100svh)] bg-[var(--ro-ink-950)] pt-[4.75rem] text-ro-canvas md:-mt-[5.25rem] md:pt-[5.25rem]"
      data-hero="resonance"
    >
      <div className="relative mx-auto flex min-h-[calc(100svh-4.75rem)] max-w-[1440px] flex-col md:min-h-[min(100svh,920px)] md:flex-row md:items-stretch">
        {/* Copy — start side (right in AR) */}
        <div className="relative z-20 order-2 flex flex-1 flex-col justify-end px-5 pb-10 pt-8 md:order-1 md:max-w-[50%] md:justify-center md:px-10 md:pb-16 lg:px-14">
          <div
            className={cn(
              "max-w-xl space-y-6",
              ready && !reduced && "ro-hero-line-a"
            )}
          >
            <p className="ro-type-overline text-ro-text-muted tracking-[0.28em]">
              {dict.home.heroLabel}
            </p>
            <h1 className="ro-type-display-xl text-balance">
              {dict.home.headline}
            </h1>
            <p
              className={cn(
                "max-w-md text-lg text-ro-text-2",
                ready && !reduced && "ro-hero-line-b"
              )}
            >
              {dict.home.sub}
            </p>
            <div
              className={cn(
                "flex flex-wrap items-center gap-4 pt-2",
                ready && !reduced && "ro-hero-line-c"
              )}
            >
              <ButtonLink
                href={href("/catalog", locale)}
                variant="inverse-primary"
              >
                {dict.home.ctaCatalog}
              </ButtonLink>
              <ButtonLink
                href="#story"
                variant="text"
                className="text-ro-canvas"
              >
                {dict.home.ctaStory}
              </ButtonLink>
            </div>
            <div
              className={cn(
                "pt-6 text-ro-text-muted",
                ready && !reduced && "ro-hero-line-d"
              )}
            >
              <Axis height={48} withAmberDot className="bg-ro-canvas opacity-50" />
            </div>
          </div>
        </div>

        {/* Visual — end side */}
        <div className="relative order-1 min-h-[48vh] flex-1 md:order-2 md:min-h-0">
          <div
            className="pointer-events-none absolute inset-0 opacity-55"
            style={{
              background:
                "radial-gradient(ellipse 60% 55% at 50% 45%, rgba(50,16,79,0.55), transparent 70%)",
            }}
            aria-hidden
          />
          <Grain className="absolute inset-0 z-[1] text-ro-canvas opacity-[0.06]" />

          {hasImage ? (
            <div className="absolute inset-0 z-[2] md:inset-y-8 md:inset-e-8 md:inset-s-4">
              <div className="relative h-full w-full overflow-hidden md:rounded-[var(--ro-r-xs)]">
                <Image
                  src={imageSrc!}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-[50%_30%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--ro-ink-950)] via-transparent to-transparent md:hidden" />
                <div className="pointer-events-none absolute inset-y-0 end-0 hidden w-24 bg-gradient-to-l from-[var(--ro-ink-950)] to-transparent md:block rtl:bg-gradient-to-r" />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 z-[2] flex items-center justify-center p-10">
              <Rings
                className={cn(
                  "h-[70%] max-h-[420px] w-[70%] max-w-[420px] text-ro-canvas",
                  !reduced && "ro-rings-idle"
                )}
                amberRingIndex={2}
                idle={!reduced}
              />
            </div>
          )}

          {/* Mobile: copy sits over bottom of visual via order; desktop split */}
        </div>
      </div>
    </section>
  );
}
