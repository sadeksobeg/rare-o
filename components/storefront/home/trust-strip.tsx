import type { Dictionary } from "@/lib/i18n/dictionaries";

export function TrustStrip({ dict }: { dict: Dictionary }) {
  const items = [
    dict.home.principleRare,
    dict.home.principleSelected,
    dict.home.principleAuthentic,
    dict.home.principleConsidered,
  ];

  return (
    <section className="border-b border-ro-border bg-ro-canvas">
      <ul className="mx-auto grid max-w-[1440px] grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => (
          <li
            key={item}
            className="border-b border-ro-border px-5 py-10 last:border-b-0 sm:px-8 lg:border-b-0 lg:border-e lg:last:border-e-0"
          >
            <p className="ro-type-overline mb-3 text-ro-plum">
              {String(i + 1).padStart(2, "0")}
            </p>
            <p className="font-display text-2xl tracking-wide md:text-3xl">
              {item}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
