import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Number then unit as one LTR run so RTL pages still read "20 كغ"
 * (not "كغ 20" from flex reordering).
 */
export function WeightText({
  kg,
  locale,
  className,
}: {
  kg: ReactNode;
  locale: Locale;
  className?: string;
}) {
  const unit = locale === "ar" ? "كغ" : "kg";
  if (kg == null || kg === "") {
    return <span className={className}>—</span>;
  }
  return (
    <span
      dir="ltr"
      className={cn("inline-flex items-baseline gap-1 tabular-nums", className)}
    >
      <span>{kg}</span>
      <span>{unit}</span>
    </span>
  );
}

/** Chip: "1 × عود = 20 كغ" with LTR numeric run. */
export function OudWeightChip({
  locale,
  count,
  kg,
  dashed,
}: {
  locale: Locale;
  count: number;
  kg: number;
  dashed?: boolean;
}) {
  const oud = locale === "ar" ? "عود" : "oud";
  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-1.5 rounded-[var(--ro-r-full)] border px-2.5 py-1 text-[11px] font-medium text-ro-ink",
        dashed
          ? "border-dashed border-[var(--ro-border-control)] text-ro-muted"
          : "border-[var(--ro-border-control)] bg-ro-sunken"
      )}
    >
      <span dir="ltr" className="inline-flex items-baseline gap-1 tabular-nums">
        <span>{count}</span>
        <span aria-hidden>×</span>
        <span>{oud}</span>
        <span aria-hidden>=</span>
        <span>{kg}</span>
        <span>{locale === "ar" ? "كغ" : "kg"}</span>
      </span>
    </span>
  );
}
