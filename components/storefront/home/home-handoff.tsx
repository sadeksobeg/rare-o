import type { Dictionary } from "@/lib/i18n/dictionaries";

export function HomeHandoff({ dict }: { dict: Dictionary }) {
  const steps = [
    dict.home.handoffStep1,
    dict.home.handoffStep2,
    dict.home.handoffStep3,
  ];

  return (
    <section id="handoff" className="border border-ro-line bg-ro-paper p-4 md:p-5">
      <h2 className="font-display text-lg tracking-wide md:text-xl">
        {dict.home.handoffTitle}
      </h2>
      <ol className="mt-3 grid gap-2 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-2 border border-ro-line bg-ro-canvas px-3 py-2.5">
            <span className="text-xs font-semibold text-ro-plum">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="text-sm leading-snug text-ro-ink">{step}</p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-ro-muted">{dict.request.handoffHint}</p>
    </section>
  );
}
