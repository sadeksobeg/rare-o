import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function TraderBand({ dict }: { dict: Dictionary }) {
  return (
    <section className="flex flex-col gap-3 border border-ro-plum bg-[var(--ro-plum-900)] p-4 text-[var(--ro-sand-100)] sm:flex-row sm:items-center sm:justify-between md:p-5">
      <div>
        <h2 className="font-display text-lg tracking-wide text-[var(--ro-sand-100)]">
          {dict.home.traderBandTitle}
        </h2>
        {/* Part 01 §3.4: plum-300 on ink-950 family — readable on plum-900 */}
        <p className="mt-1 text-sm text-[var(--ro-plum-300)]">
          {dict.home.traderBandLead}
        </p>
      </div>
      <Link
        href="/trader/login"
        className="inline-flex h-10 shrink-0 items-center justify-center bg-[var(--ro-sand-100)] px-4 text-sm font-semibold !text-[var(--ro-ink-950)] hover:bg-white"
      >
        {dict.home.traderBandCta}
      </Link>
    </section>
  );
}
