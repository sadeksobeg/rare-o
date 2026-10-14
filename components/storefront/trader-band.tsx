import { Grain } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Traders band — plum identity on void. */
export function TraderBand({ dict }: { dict: Dictionary }) {
  return (
    <section className="ro-atelier ro-atelier-stage relative overflow-hidden border border-[color-mix(in_srgb,var(--ro-plum-300)_28%,transparent)]">
      <Grain
        className="pointer-events-none absolute inset-0 text-ro-canvas opacity-[0.05]"
        patternId="ro-trader-grain"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -end-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full opacity-50 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--ro-plum-700) 45%, transparent), transparent 70%)",
        }}
      />
      <div className="relative z-[1] flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:gap-10 md:p-8 lg:p-10">
        <div className="max-w-xl space-y-3">
          <p className="ro-type-overline text-[var(--ro-plum-300)]">
            {dict.nav.traders}
          </p>
          <h2 className="ro-atelier-headline font-display text-2xl tracking-wide md:text-3xl">
            {dict.home.traderBandTitle}
          </h2>
          <p className="text-sm leading-relaxed text-[color-mix(in_srgb,var(--ro-sand-100)_60%,transparent)] md:text-base">
            {dict.home.traderBandLead}
          </p>
        </div>
        <ButtonLink
          href="/trader/login"
          variant="inverse-primary"
          size="lg"
          ripple
          className="ro-btn-atelier-solid shrink-0 rounded-full"
        >
          {dict.home.traderBandCta}
        </ButtonLink>
      </div>
    </section>
  );
}
