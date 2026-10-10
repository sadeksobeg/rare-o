import { ButtonLink } from "@/components/ui/button";
import { Rings } from "@/components/brand";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function TraderBand({ dict }: { dict: Dictionary }) {
  return (
    <section className="ro-inverse relative overflow-hidden bg-[var(--ro-ink-950)] text-ro-canvas">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 80% 50%, rgba(50,16,79,0.65), transparent 70%)",
        }}
        aria-hidden
      />
      <Rings
        className="pointer-events-none absolute -end-16 top-1/2 h-72 w-72 -translate-y-1/2 text-ro-canvas opacity-20"
        amberRingIndex={1}
      />
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between md:px-10 md:py-20 lg:px-14">
        <div className="max-w-xl space-y-3">
          <h2 className="ro-type-h2">{dict.home.traderBandTitle}</h2>
          <p className="text-ro-text-2">{dict.home.traderBandLead}</p>
        </div>
        <ButtonLink href="/trader/login" variant="inverse-primary">
          {dict.home.traderBandCta}
        </ButtonLink>
      </div>
    </section>
  );
}
