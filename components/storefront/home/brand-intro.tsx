"use client";

import { BrandMark } from "@/components/storefront/brand-mark";
import { MaskReveal, Reveal } from "@/components/storefront/motion/reveal";
import { SectionLabel } from "@/components/storefront/section-label";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { EDITORIAL } from "@/lib/brand/editorial";

export function HomeBrandIntro({ dict }: { dict: Dictionary }) {
  return (
    <section className="relative border-b border-ro-line bg-ro-cream">
      {/* Continuity from hero exit — cream already entering; no hard black band */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-ro-line/40"
        aria-hidden
      />

      <div className="mx-auto grid max-w-[1440px] md:grid-cols-12">
        <div className="flex flex-col justify-between gap-12 px-5 py-16 md:col-span-5 md:px-8 md:py-24 lg:col-span-5 lg:px-12 lg:py-28">
          <div className="space-y-8">
            <Reveal variant="up" delayMs={0}>
              <SectionLabel tone="purple">{dict.home.introEyebrow}</SectionLabel>
            </Reveal>
            <MaskReveal delayMs={120}>
              <h2 className="font-display text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.08] tracking-wide text-ro-black">
                {dict.home.introTitle}
              </h2>
            </MaskReveal>
          </div>

          <Reveal variant="up" delayMs={220}>
            <div className="space-y-6 border-s border-ro-line ps-5 md:ps-6">
              <p className="max-w-sm text-[0.95rem] leading-[1.8] text-ro-muted md:text-base">
                {dict.home.introBody}
              </p>
              <p className="text-[0.65rem] tracking-[0.28em] text-ro-purple uppercase">
                {dict.brand}
              </p>
            </div>
          </Reveal>
        </div>

        <div className="relative min-h-[420px] md:col-span-7 md:min-h-[640px] lg:min-h-[720px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={EDITORIAL.heroCloseup}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ro-black/50 via-transparent to-ro-black/20" />

          <div className="absolute bottom-8 start-5 z-10 bg-ro-cream p-5 shadow-[0_20px_60px_rgba(11,8,13,0.18)] md:bottom-12 md:start-8 md:-ms-8 md:p-7 lg:start-0 lg:-ms-10">
            <Reveal variant="scale" delayMs={180}>
              <BrandMark variant="master" tone="on-light" size="lg" />
            </Reveal>
          </div>

          <div className="absolute end-6 top-6 z-10 md:end-10 md:top-10">
            <p className="text-[0.6rem] tracking-[0.32em] text-ro-ivory-muted uppercase">
              {dict.home.introEyebrow}
            </p>
          </div>

          <div className="absolute end-6 bottom-[22%] z-10 hidden w-[38%] max-w-[260px] overflow-hidden border border-ro-line-on-dark lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={EDITORIAL.instrumentDark}
              alt=""
              className="aspect-[4/5] w-full object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
