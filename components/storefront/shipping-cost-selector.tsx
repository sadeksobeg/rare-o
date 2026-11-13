"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Check, MapPin, Package, Truck } from "lucide-react";
import { useMotion } from "@/components/motion/provider";
import { AnimatedValue } from "@/components/portal/animated-value";
import {
  calculateOudShipmentWeightKg,
  describeOudShipmentBoxes,
  INTERNATIONAL_ZONES,
  SYRIA_GOVERNORATES,
} from "@/lib/shipping/rates";
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

type QuoteMethod = {
  code: string;
  labelAr: string;
  labelEn: string;
  amount: number;
  currency: string;
  alternate: { amount: number; currency: string } | null;
};

type QuoteOk = {
  ok: true;
  methods: QuoteMethod[];
  inquiry: boolean;
  weightKg: number | null;
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
 * Destination picker that quotes through the server engine
 * (`POST /api/shipping/quote`). Display amounts are advisory — submit
 * handlers re-quote and store an immutable snapshot.
 */
export function ShippingCostSelector({
  locale,
  oudUnitCount,
  audience = "CUSTOMER",
  weightKind = "oud-box",
  onChange,
}: {
  locale: Locale;
  /** Count of oud-category items — drives the local box-weight estimate sent to the API. */
  oudUnitCount: number;
  audience?: "CUSTOMER" | "TRADER";
  /** Label: oud-box heuristic vs generic billable weight (no volumetric claim). */
  weightKind?: "oud-box" | "generic";
  onChange?: (selection: ShippingSelection | null) => void;
}) {
  const [destinationCode, setDestinationCode] = useState("");
  const [methodCode, setMethodCode] = useState<string | null>(null);
  const [options, setOptions] = useState<QuoteMethod[]>([]);
  const [inquiry, setInquiry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(false);

  const { lite } = useMotion();
  const safeOudCount = Math.max(1, oudUnitCount);
  const weightKg = useMemo(
    () => calculateOudShipmentWeightKg(safeOudCount),
    [safeOudCount]
  );
  const boxes = useMemo(
    () => describeOudShipmentBoxes(safeOudCount),
    [safeOudCount]
  );

  const selectedOption =
    options.find((o) => o.code === methodCode) ?? options[0] ?? null;

  const destinationEntry =
    SYRIA_GROUP.find((g) => g.code === destinationCode) ??
    INTL_GROUP.find((c) => c.code === destinationCode) ??
    null;

  const weightTitle =
    weightKind === "oud-box"
      ? t(locale, "الوزن المحتسب للصندوق", "Billable box weight")
      : t(locale, "الوزن المحتسب", "Billable weight");
  const weightUnit = t(locale, "كغ", "kg");
  const weightHelp = t(
    locale,
    "تقدير من قاعدة صناديق العود الحالية (زوج = 25 كغ، فرد = 20 كغ). ليس وزناً حجمياً حتى يُضبط مقسوم الحجم في الإدارة.",
    "Estimate from the current oud-box rule (pair = 25 kg, single = 20 kg). Not volumetric until an admin sets a volumetric divisor."
  );

  function emit(nextMethodCode: string | null, list: QuoteMethod[] = options) {
    const picked = list.find((o) => o.code === nextMethodCode) ?? null;
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
    setOptions([]);
    setInquiry(false);
    setQuoteError(false);
    onChange?.(null);
  }

  function selectMethod(code: string) {
    setMethodCode(code);
    emit(code);
  }

  useEffect(() => {
    if (!destinationCode) return;
    const ac = new AbortController();
    setLoading(true);
    setQuoteError(false);
    fetch("/api/shipping/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destinationCode,
        weightKg,
        audience,
      }),
      signal: ac.signal,
    })
      .then(async (res) => {
        const data = (await res.json()) as QuoteOk | { ok: false };
        if (!res.ok || !data.ok) throw new Error("quote");
        return data;
      })
      .then((data) => {
        setOptions(data.methods);
        setInquiry(data.inquiry && data.methods.length === 0);
        if (data.methods.length > 0) {
          setMethodCode((prev) => {
            const keep = prev && data.methods.some((m) => m.code === prev);
            const next = keep ? prev : data.methods[0]!.code;
            emit(next, data.methods);
            return next;
          });
        } else {
          setMethodCode(null);
          onChange?.(null);
        }
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setOptions([]);
        setInquiry(false);
        setQuoteError(true);
        onChange?.(null);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationCode, weightKg, audience]);

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
            className="h-12 max-w-full w-full appearance-none rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper ps-10 pe-3 text-ro-ink outline-none transition-colors duration-[var(--ro-dur-fast)] focus:border-[var(--ro-plum-900)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--ro-focus)]"
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

      <div className="rounded-[var(--ro-r-md)] border border-[var(--ro-border-control)] bg-ro-paper p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-ro-muted">
            <Package className="size-3.5" strokeWidth={1.5} aria-hidden />
            {weightTitle}
          </span>
          <span className="text-base font-semibold tabular-nums text-ro-ink">
            <bdi dir="ltr">
              <AnimatedValue value={weightKg} durationMs={lite ? 1 : 550} />{" "}
              {weightUnit}
            </bdi>
          </span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-ro-muted">{weightHelp}</p>
        {weightKind === "oud-box" ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5" aria-hidden>
            <AnimatePresence initial={false}>
              {Array.from({ length: boxes.pairs }).map((_, i) => (
                <m.span
                  key={`pair-${i}`}
                  layout={!lite}
                  initial={lite ? false : { opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={lite ? undefined : { opacity: 0, scale: 0.85 }}
                  transition={{
                    duration: lite ? 0 : 0.22,
                    delay: lite ? 0 : i * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-flex items-center gap-1 rounded-[var(--ro-r-full)] border border-[var(--ro-border-control)] bg-ro-sunken px-2.5 py-1 text-[11px] font-medium tabular-nums text-ro-ink"
                >
                  <bdi dir="ltr">
                    2 × {t(locale, "عود", "oud")} = 25 {weightUnit}
                  </bdi>
                </m.span>
              ))}
              {boxes.remainder ? (
                <m.span
                  key="single"
                  layout={!lite}
                  initial={lite ? false : { opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={lite ? undefined : { opacity: 0, scale: 0.85 }}
                  transition={{
                    duration: lite ? 0 : 0.22,
                    delay: lite ? 0 : boxes.pairs * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-flex items-center gap-1 rounded-[var(--ro-r-full)] border border-dashed border-[var(--ro-border-control)] px-2.5 py-1 text-[11px] font-medium tabular-nums text-ro-muted"
                >
                  <bdi dir="ltr">
                    1 × {t(locale, "عود", "oud")} = 20 {weightUnit}
                  </bdi>
                </m.span>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-ro-muted" role="status">
          {t(locale, "جاري حساب الشحن…", "Calculating shipping…")}
        </p>
      ) : null}

      {quoteError ? (
        <p className="text-sm text-[var(--ro-danger-700)]" role="alert">
          {t(
            locale,
            "تعذّر حساب الشحن الآن — أعد المحاولة أو أكمل الطلب لعرض سعر يدوي.",
            "Could not quote shipping right now — retry or complete the request for a manual quote."
          )}
        </p>
      ) : null}

      {destinationCode && !loading && (inquiry || options.length === 0) && !quoteError ? (
        <div
          role="status"
          className="rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-sunken px-3.5 py-3 text-sm text-ro-ink"
        >
          <p className="font-medium">
            {t(locale, "اطلب عرض سعر", "Request a quote")}
          </p>
          <p className="mt-1 text-xs text-ro-muted">
            {t(
              locale,
              "نجهّز لك عرضاً خاصاً لهذه الوجهة أو الوزن — أكمل الطلب وسنتواصل عبر واتساب.",
              "We'll prepare a custom quote for this destination or weight — complete the request and we'll follow up on WhatsApp."
            )}
          </p>
          <input type="hidden" name="shippingInquiry" value="1" />
        </div>
      ) : null}

      {options.length > 0 ? (
        <div
          role="radiogroup"
          aria-label={t(locale, "طريقة الشحن", "Shipping method")}
          className="grid gap-2 sm:grid-cols-2"
        >
          {options.map((opt, i) => {
            const active = (methodCode ?? options[0]?.code) === opt.code;
            return (
              <m.button
                key={opt.code}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => selectMethod(opt.code)}
                initial={lite ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: lite ? 0 : 0.22,
                  delay: lite ? 0 : i * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileTap={lite ? undefined : { scale: 0.98 }}
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
                  <AnimatePresence initial={false} mode="wait">
                    {active ? (
                      <m.span
                        key="on"
                        initial={lite ? false : { scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={lite ? undefined : { scale: 0.4, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 28 }}
                        className="flex items-center justify-center"
                      >
                        <Check className="size-3" strokeWidth={2} />
                      </m.span>
                    ) : null}
                  </AnimatePresence>
                </span>
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-ro-ink">
                    <Truck className="size-3.5 shrink-0 text-ro-muted" strokeWidth={1.5} aria-hidden />
                    {t(locale, opt.labelAr, opt.labelEn)}
                  </span>
                  <span className="relative block h-[1.375rem] overflow-hidden text-base font-semibold tabular-nums text-ro-ink">
                    <AnimatePresence initial={false} mode="popLayout">
                      <m.span
                        key={`${opt.amount}-${opt.currency}`}
                        initial={lite ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={lite ? undefined : { opacity: 0, y: -8 }}
                        transition={{ duration: lite ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0"
                      >
                        <bdi dir="ltr">
                          {opt.amount} {opt.currency}
                        </bdi>
                      </m.span>
                    </AnimatePresence>
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
              </m.button>
            );
          })}
        </div>
      ) : null}

      <input
        type="hidden"
        name="destinationCountry"
        value={
          destinationEntry
            ? t(locale, destinationEntry.nameAr, destinationEntry.nameEn)
            : ""
        }
      />
      <input type="hidden" name="destinationCode" value={destinationCode} />
      <input
        type="hidden"
        name="shippingMethodCode"
        value={selectedOption ? (methodCode ?? selectedOption.code) : ""}
      />
      <input
        type="hidden"
        name="shippingMethodLabel"
        value={
          selectedOption
            ? t(locale, selectedOption.labelAr, selectedOption.labelEn)
            : ""
        }
      />
    </div>
  );
}
