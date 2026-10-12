import { Reveal } from "@/components/storefront/motion/reveal";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Typographic manifesto — pull-quote density after the hero. */
export function HomeManifesto({ dict }: { dict: Dictionary }) {
  return (
    <section className="relative overflow-hidden border-b border-ro-line bg-[var(--ro-sand-50)]">
      <div className="pointer-events-none absolute inset-0 ro-ms-grid-ink opacity-70" aria-hidden />
      <div className="relative mx-auto max-w-[1440px] px-5 py-16 md:px-8 md:py-24 lg:px-12">
        <Reveal>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="space-y-4 lg:col-span-4">
              <p className="ro-type-overline text-ro-plum">
                {dict.home.introEyebrow}
              </p>
              <p className="font-display text-sm tracking-[0.28em] text-ro-muted">
                {dict.brand}
              </p>
              <div className="ro-ms-rule-ink max-w-[6rem]" />
              <p className="hidden max-w-[12rem] text-xs leading-relaxed text-ro-muted lg:block">
                {dict.home.footerTagline}
              </p>
            </div>

            <div className="space-y-8 lg:col-span-8">
              <h2 className="font-display text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.1] tracking-wide">
                {dict.home.introTitle}
              </h2>
              <div className="ro-ms-rule-ink max-w-xs" />
              <p className="max-w-2xl text-lg leading-[1.9] text-ro-text-2 md:text-xl">
                {dict.home.introBody}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
