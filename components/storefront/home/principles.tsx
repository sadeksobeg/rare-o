import { SectionLabel } from "@/components/storefront/section-label";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function HomePrinciples({ dict }: { dict: Dictionary }) {
  const items = [
    dict.home.principleRare,
    dict.home.principleSelected,
    dict.home.principleAuthentic,
    dict.home.principleConsidered,
  ];

  return (
    <section className="border-b border-ro-line bg-ro-purple text-ro-cream">
      <div className="mx-auto max-w-[1440px] space-y-12 px-5 py-20 md:px-8 md:py-24 lg:px-12">
        <div className="space-y-4">
          <SectionLabel tone="dark">{dict.home.principlesEyebrow}</SectionLabel>
          <h2 className="font-display text-3xl tracking-wide md:text-4xl">
            {dict.home.principlesTitle}
          </h2>
        </div>

        <ul className="grid gap-0 border-t border-ro-line-on-dark sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li
              key={item}
              className="border-b border-ro-line-on-dark px-0 py-10 sm:border-e sm:px-6 sm:last:border-e-0 lg:py-12"
            >
              <p className="font-display text-3xl tracking-[0.12em] md:text-4xl">
                {item}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
