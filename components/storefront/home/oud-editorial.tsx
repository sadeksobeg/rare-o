import { BrandMark } from "@/components/storefront/brand-mark";
import { SectionLabel } from "@/components/storefront/section-label";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { EDITORIAL } from "@/lib/brand/editorial";

export function HomeOudEditorial({ dict }: { dict: Dictionary }) {
  return (
    <section className="border-b border-ro-line bg-ro-black text-ro-cream">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-20 md:grid-cols-12 md:gap-8 md:px-8 md:py-28 lg:px-12">
        <div className="flex flex-col justify-between gap-10 md:col-span-5 lg:col-span-4">
          <div className="space-y-6">
            <SectionLabel tone="dark">{dict.home.oudEyebrow}</SectionLabel>
            <h2 className="font-display text-4xl leading-[1.12] tracking-wide md:text-5xl lg:text-[3.25rem]">
              {dict.home.oudTitle}
            </h2>
          </div>
          <div className="space-y-5 border-s border-ro-line-on-dark ps-5">
            <p className="text-base leading-relaxed text-ro-ivory-muted md:text-lg">
              {dict.home.oudBody}
            </p>
            <p className="text-[0.7rem] tracking-[0.14em] text-ro-ivory-muted/70 uppercase">
              {dict.home.oudDetail}
            </p>
          </div>
        </div>

        <div className="relative min-h-[320px] overflow-hidden md:col-span-7 md:min-h-[440px] lg:col-span-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={EDITORIAL.oudHeritage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ro-black/70 via-ro-black/15 to-transparent" />
          <div className="absolute bottom-6 start-6 end-6 flex items-end justify-between gap-4 md:bottom-8 md:start-8 md:end-8">
            <div className="flex items-center gap-4">
              <BrandMark variant="master" tone="on-dark" size="sm" />
              <p className="font-display text-2xl tracking-[0.2em] md:text-3xl">
                {dict.brand}
              </p>
            </div>
            <SectionLabel tone="dark">{dict.home.oudEyebrow}</SectionLabel>
          </div>
        </div>
      </div>
    </section>
  );
}
