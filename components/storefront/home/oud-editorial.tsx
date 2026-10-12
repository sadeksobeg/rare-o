import type { Dictionary } from "@/lib/i18n/dictionaries";

export function HomeOudEditorial({ dict }: { dict: Dictionary }) {
  return (
    <section
      id="story"
      className="border border-ro-line bg-[var(--ro-ink-950)] p-4 text-[var(--ro-sand-100)] md:p-5"
    >
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--ro-amber-400)]">
        {dict.home.oudEyebrow}
      </p>
      <h2 className="mt-2 font-display text-lg tracking-wide text-[var(--ro-sand-100)] md:text-xl">
        {dict.home.oudTitle}
      </h2>
      {/* Part 01 §3.4: ink-200 on ink-950 — secondary on dark */}
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ro-ink-200)]">
        {dict.home.oudBody}
      </p>
    </section>
  );
}
