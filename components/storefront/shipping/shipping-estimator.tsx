"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  ShippingCostSelector,
  type ShippingSelection,
} from "@/components/storefront/shipping-cost-selector";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * PDP / standalone estimator: collapsible on PDP, always open on /shipping.
 */
export function ShippingEstimator({
  locale,
  mode = "pdp",
  initialWeightKg,
  oudUnitCount = 1,
  className,
}: {
  locale: Locale;
  mode?: "pdp" | "page";
  initialWeightKg?: number | null;
  oudUnitCount?: number;
  className?: string;
}) {
  // PDP opens by default so the estimator is visible in the buy column at 1440/390.
  const [open, setOpen] = useState(true);
  const [selection, setSelection] = useState<ShippingSelection | null>(null);
  const [oudCount, setOudCount] = useState(Math.max(1, oudUnitCount));
  const weightOverride = useMemo(() => {
    if (initialWeightKg != null && Number.isFinite(initialWeightKg)) {
      return initialWeightKg;
    }
    return null;
  }, [initialWeightKg]);

  const title = locale === "ar" ? "احسب الشحن" : "Estimate shipping";
  const lead =
    locale === "ar"
      ? "تقدير غير ملزم — السعر النهائي يُؤكَّد مع الفريق."
      : "Advisory estimate — final price confirmed with the team.";

  return (
    <div
      data-testid="ro-shipping-estimator"
      className={cn(
        "rounded-[var(--ro-r-md)] border border-[var(--ro-border-control)] bg-ro-paper",
        className
      )}
    >
      {mode === "pdp" ? (
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span>
            <span className="block text-sm font-semibold text-ro-ink">
              {title}
            </span>
            <span className="mt-0.5 block text-xs text-ro-muted">{lead}</span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-ro-muted transition-transform",
              open && "rotate-180"
            )}
            strokeWidth={1.5}
            aria-hidden
          />
        </button>
      ) : (
        <div className="border-b border-[var(--ro-border-control)] px-4 py-3.5">
          <h2 className="text-sm font-semibold text-ro-ink">{title}</h2>
          <p className="mt-0.5 text-xs text-ro-muted">{lead}</p>
        </div>
      )}

      {open || mode === "page" ? (
        <div className="space-y-3 px-4 pb-4 pt-1">
          {mode === "page" ? (
            <div className="space-y-2">
              <span className="block text-sm font-medium text-ro-ink">
                {locale === "ar" ? "عدد الأعواد" : "Number of ouds"}
              </span>
              <div className="flex items-center gap-3">
                <div
                  dir="ltr"
                  role="group"
                  aria-label={locale === "ar" ? "عدد الأعواد" : "Number of ouds"}
                  className="inline-flex items-center rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)]"
                >
                  <button
                    type="button"
                    aria-label={locale === "ar" ? "أنقص" : "Decrease"}
                    disabled={oudCount <= 1}
                    onClick={() => setOudCount((n) => Math.max(1, n - 1))}
                    className="flex size-11 items-center justify-center text-lg text-ro-ink disabled:opacity-35"
                  >
                    −
                  </button>
                  <output
                    className="min-w-12 text-center text-base font-semibold tabular-nums text-ro-ink"
                    aria-live="polite"
                  >
                    {oudCount}
                  </output>
                  <button
                    type="button"
                    aria-label={locale === "ar" ? "زد" : "Increase"}
                    disabled={oudCount >= 40}
                    onClick={() => setOudCount((n) => Math.min(40, n + 1))}
                    className="flex size-11 items-center justify-center text-lg text-ro-ink disabled:opacity-35"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-ro-muted">
                  {locale === "ar"
                    ? "كل عودين يُشحنان في صندوق واحد."
                    : "Every two ouds ship in one case."}
                </p>
              </div>
            </div>
          ) : null}

          <ShippingCostSelector
            locale={locale}
            oudUnitCount={oudCount}
            weightKgOverride={weightOverride}
            weightKind={weightOverride != null ? "generic" : "oud-box"}
            onChange={setSelection}
            compact={mode === "pdp"}
          />

          {selection?.inquiry ? (
            <p className="text-sm text-ro-ink">
              <span className="text-ro-muted">
                {locale === "ar" ? "ملخص:" : "Summary:"}{" "}
              </span>
              <span className="font-semibold">
                {locale === "ar" ? "يُحدَّد بعرض سعر" : "Quoted on request"}
              </span>
              <span className="text-ro-muted">
                {" "}
                · {selection.destinationCountry}
              </span>
            </p>
          ) : null}
          {selection && !selection.inquiry ? (
            <p className="text-sm text-ro-ink">
              <span className="text-ro-muted">
                {locale === "ar" ? "ملخص:" : "Summary:"}{" "}
              </span>
              <bdi dir="ltr" className="font-semibold">
                {selection.amount} {selection.currency}
              </bdi>
              <span className="text-ro-muted">
                {" "}
                · {selection.methodLabel} · {selection.destinationCountry}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
