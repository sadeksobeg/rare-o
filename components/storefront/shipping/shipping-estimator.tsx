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
  const [manualKg, setManualKg] = useState<string>(
    initialWeightKg != null ? String(initialWeightKg) : ""
  );

  const weightOverride = useMemo(() => {
    if (mode === "page" && manualKg.trim()) {
      const n = Number(manualKg);
      if (Number.isFinite(n) && n >= 0) return n;
    }
    if (initialWeightKg != null && Number.isFinite(initialWeightKg)) {
      return initialWeightKg;
    }
    return null;
  }, [mode, manualKg, initialWeightKg]);

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
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-ro-ink">
                  {locale === "ar" ? "عدد صناديق العود" : "Oud box count"}
                </span>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={oudCount}
                  onChange={(e) =>
                    setOudCount(Math.max(1, Math.min(40, Number(e.target.value) || 1)))
                  }
                  className="h-11 w-full rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 tabular-nums"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-ro-ink">
                  {locale === "ar"
                    ? "وزن يدوي (كغ، اختياري)"
                    : "Manual weight (kg, optional)"}
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={manualKg}
                  onChange={(e) => setManualKg(e.target.value)}
                  placeholder="—"
                  className="h-11 w-full rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 tabular-nums"
                  dir="ltr"
                />
              </label>
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
