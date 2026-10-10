import { BrandMark } from "@/components/storefront/brand-mark";
import { RoButtonLink } from "@/components/ui/ro-button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { EDITORIAL } from "@/lib/brand/editorial";

export function HomeFinalCta({ dict }: { dict: Dictionary }) {
  return (
    <section className="relative overflow-hidden border-b border-ro-line bg-ro-black text-ro-cream">
      <div className="absolute inset-0 opacity-40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={EDITORIAL.instrumentDark}
          alt=""
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ro-black via-ro-black/85 to-ro-black/55 rtl:bg-gradient-to-l" />
      </div>

      <div className="relative mx-auto grid max-w-[1440px] gap-12 px-5 py-20 md:grid-cols-12 md:items-center md:px-8 md:py-28 lg:px-12">
        <div className="flex justify-center md:col-span-4 md:justify-start">
          <BrandMark variant="master" tone="on-dark" size="xl" />
        </div>
        <div className="space-y-8 md:col-span-8">
          <div className="max-w-2xl space-y-5">
            <h2 className="font-display text-3xl leading-tight tracking-wide md:text-5xl">
              {dict.home.finalCtaTitle}
            </h2>
            <p className="text-base leading-relaxed text-ro-ivory-muted md:text-lg">
              {dict.home.finalCtaSub}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <RoButtonLink href="/catalog" variant="on-dark">
              {dict.home.finalCtaButton}
            </RoButtonLink>
            <RoButtonLink href="/offers" variant="on-dark-outline">
              {dict.home.finalCtaSecondary}
            </RoButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
