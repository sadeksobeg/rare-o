"use client";

import { Reveal } from "@/components/storefront/motion/reveal";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

/** Principles chapter — plum identity on dark stage (no gold). */
export function TrustStrip({ dict }: { dict: Dictionary }) {
  const items = [
    { label: dict.home.principleRare, body: dict.home.heroFeatRare },
    { label: dict.home.principleSelected, body: dict.home.heroFeatSelected },
    { label: dict.home.principleAuthentic, body: dict.home.heroFeatAuthentic },
    { label: dict.home.principleConsidered, body: dict.home.heroFeatConsidered },
  ];

  return (
    <section
      className="ro-atelier ro-atelier-stage relative overflow-hidden border-b border-[color-mix(in_srgb,var(--ro-plum-300)_18%,transparent)]"
      data-home-section="trust"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 80% 0%, color-mix(in srgb, var(--ro-plum-700) 28%, transparent), transparent 60%), radial-gradient(ellipse 40% 50% at 10% 100%, color-mix(in srgb, var(--ro-plum-900) 35%, transparent), transparent 65%)",
        }}
      />

      <div className="relative z-[1] mx-auto max-w-[1440px] px-5 pb-2 pt-16 md:px-8 md:pt-20">
        <Reveal className="mb-12 md:mb-16">
          <p className="ro-type-overline text-[var(--ro-plum-300)]">
            {dict.home.principlesEyebrow}
          </p>
          <h2 className="ro-atelier-headline mt-3 font-display text-3xl tracking-wide md:text-5xl">
            {dict.home.principlesTitle}
          </h2>
        </Reveal>
      </div>

      <ul className="relative z-[1] mx-auto grid max-w-[1440px] grid-cols-1 gap-0 border-t border-[color-mix(in_srgb,var(--ro-plum-300)_20%,transparent)] px-5 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {items.map((item, i) => (
          <li
            key={item.label}
            className={cn(
              "group border-b border-[color-mix(in_srgb,var(--ro-plum-300)_14%,transparent)] py-10 sm:px-6 lg:border-b-0 lg:border-e lg:py-14",
              i === items.length - 1 && "lg:border-e-0"
            )}
          >
            <Reveal delayMs={80 + i * 90}>
              <p className="ro-type-overline mb-6 text-[var(--ro-plum-300)]">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="font-display text-3xl tracking-wide text-[var(--ro-sand-100)] transition-colors duration-500 group-hover:text-[var(--ro-plum-300)] md:text-4xl">
                {item.label}
              </p>
              <p className="mt-4 max-w-[18ch] text-sm leading-relaxed text-[color-mix(in_srgb,var(--ro-sand-100)_55%,transparent)]">
                {item.body}
              </p>
              <div
                aria-hidden
                className="mt-8 h-px w-10 origin-start bg-[var(--ro-plum-300)] transition-all duration-500 group-hover:w-16"
              />
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
