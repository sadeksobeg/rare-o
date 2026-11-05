"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, MapPin, Truck } from "lucide-react";
import {
  calculateOudShipmentWeightKg,
  INTERNATIONAL_ZONES,
  SYRIA_GOVERNORATES,
} from "@/lib/shipping/rates";
import { resolveAvailableMethods } from "@/lib/shipping/resolve-available-methods";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export type ShippingSelection = {
  destinationCountry: string;
  destinationCode: string;
  methodCode: string;
  methodLabel: string;
  amount: number;
  currency: string;
};

const SYRIA_GROUP = SYRIA_GOVERNORATES.map((g) => ({
  code: g.code,
  nameAr: g.nameAr,
  nameEn: g.nameEn,
}));

const INTL_GROUP = INTERNATIONAL_ZONES.flatMap((z) =>
  z.countries.map((c) => ({ code: c.code, nameAr: c.nameAr, nameEn: c.nameEn }))
).sort((a, b) => a.nameEn.localeCompare(b.nameEn));

const t = (locale: Locale, ar: string, en: string) => (locale === "ar" ? ar : en);

/**
 * World-class, zero-round-trip shipping picker: the rate sheet is static
 * data imported straight into this client component, so selecting a
 * destination computes real prices instantly — no server call, no spinner.
 * Writes hidden form fields (`destinationCountry`, `destinationCode`,
 * `shippingMethodCode`, `shippingMethodLabel`) that the existing retail
 * request action/schema already expect.
 */
export function ShippingCostSelector({
  locale,
  oudUnitCount,
  onChange,
}: {
  locale: Locale;
  /** Count of oud-category items in the cart — drives billable weight. */
  oudUnitCount: number;
  onChange?: (selection: ShippingSelection | null) => void;
}) {
  const [destinationCode, setDestinationCode] = useState("");
  const [methodCode, setMethodCode] = useState<string | null>(null);

  const weightKg = useMemo(
    () => calculateOudShipmentWeightKg(Math.max(1, oudUnitCount)),
    [oudUnitCount]
  );

  const options = useMemo(
    () =>
      destinationCode ? resolveAvailableMethods(destinationCode, weightKg) : [],
    [destinationCode, weightKg]
  );

  const selectedOption =
    options.find((o) => o.code === methodCode) ?? options[0] ?? null;

  const destinationEntry =
    SYRIA_GROUP.find((g) => g.code === destinationCode) ??
    INTL_GROUP.find((c) => c.code === destinationCode) ??
    null;

  function emit(nextMethodCode: string | null) {
    const picked = options.find((o) => o.code === nextMethodCode) ?? null;
    if (!picked || !destinationEntry) {
      onChange?.(null);
      return;
    }
    onChange?.({
      destinationCountry: t(locale, destinationEntry.nameAr, destinationEntry.nameEn),
      destinationCode,
      methodCode: picked.code,
      methodLabel: t(locale, picked.labelAr, picked.labelEn),
      amount: picked.amount,
      currency: picked.currency,
    });
  }

  function selectDestination(code: string) {
    setDestinationCode(code);
    setMethodCode(null);
    onChange?.(null);
  }

  function selectMethod(code: string) {
    setMethodCode(code);
    emit(code);
  }

  // Auto-pick the cheapest option (options[0] — resolveAvailableMethods
  // already sorts domestic carriers by price; international land/air are
  // listed land-first, generally the cheaper of the two) so the order
  // summary always has a real number, even if the shopper never touches
  // the method cards.
  useEffect(() => {
    if (options.length > 0 && methodCode == null) {
      emit(options[0]!.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  return (
    <div className="space-y-3">
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-ro-ink">
          {t(locale, "وجهة الشحن", "Shipping destination")}
        </span>
        <span className="relative block">
          <MapPin
            className="pointer-events-none absolute top-1/2 ms-3 size-4 -translate-y-1/2 text-ro-muted"
            strokeWidth={1.5}
            aria-hidden
          />
          <select
            required
            value={destinationCode}
            onChange={(e) => selectDestination(e.target.value)}
            className="h-12 w-full appearance-none rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper ps-10 pe-3 text-ro-ink outline-none transition-colors duration-[var(--ro-dur-fast)] focus:border-[var(--ro-plum-900)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--ro-focus)]"
          >
            <option value="">
              {t(locale, "اختر الدولة أو المحافظة…", "Choose a country or governorate…")}
            </option>
            <optgroup label={t(locale, "سوريا — توصيل محلي", "Syria — domestic")}>
              {SYRIA_GROUP.map((g) => (
                <option key={g.code} value={g.code}>
                  {t(locale, g.nameAr, g.nameEn)}
                </option>
              ))}
            </optgroup>
            <optgroup label={t(locale, "دولي", "International")}>
              {INTL_GROUP.map((c) => (
                <option key={c.code} value={c.code}>
                  {t(locale, c.nameAr, c.nameEn)}
                </option>
              ))}
            </optgroup>
          </select>
        </span>
      </label>

      {destinationCode && options.length === 0 ? (
        <p className="rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-sunken px-3 py-2.5 text-xs text-ro-muted">
          {t(
            locale,
            "سيتم تأكيد تكلفة الشحن لهذه الوجهة مع فريق RARE OUD عبر واتساب.",
            "Shipping cost for this destination will be confirmed with the RARE OUD team over WhatsApp."
          )}
        </p>
      ) : null}

      {options.length > 0 ? (
        <div role="radiogroup" aria-label={t(locale, "طريقة الشحن", "Shipping method")} className="grid gap-2 sm:grid-cols-2">
          {options.map((opt) => {
            const active = (methodCode ?? options[0]?.code) === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => selectMethod(opt.code)}
                className={cn(
                  "flex items-start gap-2.5 rounded-[var(--ro-r-sm)] border px-3.5 py-3 text-start transition-colors duration-[var(--ro-dur-fast)]",
                  active
                    ? "border-[var(--ro-plum-900)] bg-[color-mix(in_srgb,var(--ro-plum-900)_6%,transparent)]"
                    : "border-[var(--ro-border-control)] hover:bg-ro-sunken"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[var(--ro-r-full)] border",
                    active
                      ? "border-[var(--ro-plum-900)] bg-[var(--ro-plum-900)] text-ro-canvas"
                      : "border-[var(--ro-border-control)] text-transparent"
                  )}
                  aria-hidden
                >
                  <Check className="size-3" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-ro-ink">
                    <Truck className="size-3.5 shrink-0 text-ro-muted" strokeWidth={1.5} aria-hidden />
                    {t(locale, opt.labelAr, opt.labelEn)}
                  </span>
                  <span className="block text-base font-semibold tabular-nums text-ro-ink">
                    <bdi dir="ltr">
                      {opt.amount} {opt.currency}
                    </bdi>
                  </span>
                  {opt.alternate ? (
                    <span className="block text-[11px] text-ro-muted">
                      <bdi dir="ltr">
                        {t(locale, "أو ", "or ")}
                        {opt.alternate.amount} {opt.alternate.currency}{" "}
                        {t(locale, "عند التسديد هناك", "paid there")}
                      </bdi>
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {selectedOption ? (
        <p className="text-xs text-ro-muted">
          {t(
            locale,
            `الوزن التقديري للشحنة: ${weightKg} كغ`,
            `Estimated shipment weight: ${weightKg} kg`
          )}
        </p>
      ) : null}

      <input type="hidden" name="destinationCountry" value={destinationEntry ? t(locale, destinationEntry.nameAr, destinationEntry.nameEn) : ""} />
      <input type="hidden" name="destinationCode" value={destinationCode} />
      <input
        type="hidden"
        name="shippingMethodCode"
        value={selectedOption ? (methodCode ?? selectedOption.code) : ""}
      />
      <input
        type="hidden"
        name="shippingMethodLabel"
        value={selectedOption ? t(locale, selectedOption.labelAr, selectedOption.labelEn) : ""}
      />
    </div>
  );
}
