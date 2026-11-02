import { cn } from "@/lib/utils";

export type ShippingStep = {
  id: string;
  label: string;
  done: boolean;
  current: boolean;
};

/** OPS-04 — horizontal shipping progress (transform/opacity-friendly). */
export function ShippingTracker({
  title,
  steps,
  carrier,
  tracking,
}: {
  title: string;
  steps: ShippingStep[];
  carrier?: string | null;
  tracking?: string | null;
}) {
  return (
    <div className="rounded-[var(--ro-r-sm)] border border-ro-line bg-ro-surface p-5">
      <h2 className="font-display text-base font-semibold text-ro-ink">
        {title}
      </h2>
      {(carrier || tracking) && (
        <p className="mt-1 text-sm text-ro-muted">
          {carrier || "—"}
          {tracking ? (
            <>
              {" · "}
              <span dir="ltr">{tracking}</span>
            </>
          ) : null}
        </p>
      )}
      <ol className="mt-5 flex flex-wrap gap-2">
        {steps.map((step, i) => (
          <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                step.done || step.current
                  ? "bg-[var(--ro-plum-900)] text-[var(--ro-sand-50)]"
                  : "bg-[var(--ro-sand-200)] text-ro-muted"
              )}
              aria-current={step.current ? "step" : undefined}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                step.current ? "text-ro-ink" : "text-ro-muted"
              )}
            >
              {step.label}
            </span>
            {i < steps.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "ms-auto hidden h-0.5 w-full min-w-4 max-w-10 sm:block",
                  step.done ? "bg-[var(--ro-plum-900)]" : "bg-[var(--ro-sand-300)]"
                )}
              />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
