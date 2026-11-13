"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Package } from "lucide-react";
import { useMotion } from "@/components/motion/provider";
import { AnimatedValue } from "@/components/portal/animated-value";
import { DestinationCombobox } from "@/components/storefront/shipping/destination-combobox";
import { MethodCard } from "@/components/storefront/shipping/method-card";
import {
  OudWeightChip,
  WeightText,
} from "@/components/storefront/shipping/weight-text";
import {
  calculateOudShipmentWeightKg,
  describeOudShipmentBoxes,
} from "@/lib/shipping/rates";
import { listDestinationOptions } from "@/lib/shipping/destination-options";
import {
  computeMethodBadges,
  inquiryReasonLabel,
  rememberDestination,
  type QuoteMethodUi,
} from "@/lib/shipping/quote-ui";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export type ShippingSelection = {
  destinationCountry: string;
  destinationCode: string;
  methodCode: string;
  methodLabel: string;
  amount: number;
  currency: string;
  inquiry?: boolean;
};

type QuoteOk = {
  ok: true;
  methods: QuoteMethodUi[];
  inquiry: boolean;
  inquiryReason: string | null;
  inquiryNote: { ar: string; en: string } | null;
  weightKg: number | null;
};

const t = (locale: Locale, ar: string, en: string) =>
  locale === "ar" ? ar : en;

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
  weightKgOverride,
  onChange,
  showStickyHint = false,
  compact = false,
  onInquiryChange,
}: {
  locale: Locale;
  oudUnitCount: number;
  audience?: "CUSTOMER" | "TRADER";
  weightKind?: "oud-box" | "generic";
  weightKgOverride?: number | null;
  onChange?: (selection: ShippingSelection | null) => void;
  showStickyHint?: boolean;
  compact?: boolean;
  onInquiryChange?: (state: {
    inquiry: boolean;
    reason: string | null;
  }) => void;
}) {
  const [destinationCode, setDestinationCode] = useState("");
  const [methodCode, setMethodCode] = useState<string | null>(null);
  const [options, setOptions] = useState<QuoteMethodUi[]>([]);
  const [inquiry, setInquiry] = useState(false);
  const [inquiryReason, setInquiryReason] = useState<string | null>(null);
  const [inquiryNote, setInquiryNote] = useState<{
    ar: string;
    en: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(false);

  const { lite } = useMotion();
  const safeOudCount = Math.max(1, oudUnitCount);
  const weightKg = useMemo(() => {
    if (weightKgOverride != null && Number.isFinite(weightKgOverride)) {
      return Math.max(0, weightKgOverride);
    }
    return calculateOudShipmentWeightKg(safeOudCount);
  }, [safeOudCount, weightKgOverride]);
  const boxes = useMemo(
    () => describeOudShipmentBoxes(safeOudCount),
    [safeOudCount]
  );
  const badges = useMemo(() => computeMethodBadges(options), [options]);

  const selectedOption =
    options.find((o) => o.code === methodCode) ?? options[0] ?? null;

  const destinationEntry =
    listDestinationOptions().find((g) => g.code === destinationCode) ?? null;

  const weightTitle =
    weightKind === "oud-box"
      ? t(locale, "الوزن المحتسب للصندوق", "Billable box weight")
      : t(locale, "الوزن المحتسب", "Billable weight");
  const weightHelp = t(
    locale,
    "تقدير وزن الشحن بحسب حجم صناديق العود (زوج = 25 كغ، فرد = 20 كغ).",
    "Shipping weight estimate based on oud box sizes (pair = 25 kg, single = 20 kg)."
  );

  function emit(
    nextMethodCode: string | null,
    list: QuoteMethodUi[] = options,
    isInquiry = inquiry
  ) {
    if (!destinationEntry) {
      onChange?.(null);
      return;
    }
    if (isInquiry && list.length === 0) {
      onChange?.({
        destinationCountry: t(
          locale,
          destinationEntry.nameAr,
          destinationEntry.nameEn
        ),
        destinationCode,
        methodCode: "",
        methodLabel: "",
        amount: 0,
        currency: "USD",
        inquiry: true,
      });
      return;
    }
    const picked = list.find((o) => o.code === nextMethodCode) ?? null;
    if (!picked) {
      onChange?.(null);
      return;
    }
    onChange?.({
      destinationCountry: t(
        locale,
        destinationEntry.nameAr,
        destinationEntry.nameEn
      ),
      destinationCode,
      methodCode: picked.code,
      methodLabel: t(locale, picked.labelAr, picked.labelEn),
      amount: picked.amount,
      currency: picked.currency,
      inquiry: false,
    });
  }

  function selectDestination(code: string) {
    setDestinationCode(code);
    rememberDestination(code);
    setMethodCode(null);
    setOptions([]);
    setInquiry(false);
    setInquiryReason(null);
    setQuoteError(false);
    onChange?.(null);
    onInquiryChange?.({ inquiry: false, reason: null });
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
        const inq = Boolean(data.inquiry && data.methods.length === 0);
        setInquiry(inq);
        setInquiryReason(data.inquiryReason);
        setInquiryNote(data.inquiryNote);
        onInquiryChange?.({ inquiry: inq, reason: data.inquiryReason });
        if (data.methods.length > 0) {
          setMethodCode((prev) => {
            const keep = prev && data.methods.some((m) => m.code === prev);
            const next = keep ? prev : data.methods[0]!.code;
            emit(next, data.methods, false);
            return next;
          });
        } else {
          setMethodCode(null);
          emit(null, [], inq);
        }
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setOptions([]);
        setInquiry(false);
        setQuoteError(true);
        onChange?.(null);
        onInquiryChange?.({ inquiry: false, reason: null });
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationCode, weightKg, audience]);

  const showInquiryCard =
    Boolean(destinationCode) &&
    !loading &&
    (inquiry || options.length === 0) &&
    !quoteError;

  const stickyAmount =
    showStickyHint && selectedOption && !inquiry ? selectedOption : null;

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-ro-ink">
          {t(locale, "وجهة الشحن", "Shipping destination")}
        </span>
        <DestinationCombobox
          locale={locale}
          value={destinationCode}
          onChange={(code) => {
            if (!code) {
              setDestinationCode("");
              onChange?.(null);
              return;
            }
            selectDestination(code);
          }}
        />
      </label>

      {!compact ? (
        <div className="rounded-[var(--ro-r-md)] border border-[var(--ro-border-control)] bg-ro-paper p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-ro-muted">
              <Package className="size-3.5" strokeWidth={1.5} aria-hidden />
              {weightTitle}
            </span>
            <span className="text-base font-semibold text-ro-ink">
              <WeightText
                locale={locale}
                kg={
                  <AnimatedValue value={weightKg} durationMs={lite ? 1 : 550} />
                }
              />
            </span>
          </div>
          {weightKind === "oud-box" && weightKgOverride == null ? (
            <>
              <p className="mt-1.5 text-[11px] leading-relaxed text-ro-muted">
                {weightHelp}
              </p>
              <div
                className="mt-2.5 flex flex-wrap items-center gap-1.5"
                aria-hidden
              >
                <AnimatePresence initial={false}>
                  {Array.from({ length: boxes.pairs }).map((_, i) => (
                    <m.span
                      key={`pair-${i}`}
                      layout={!lite}
                      initial={lite ? false : { opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={lite ? undefined : { opacity: 0, scale: 0.85 }}
                    >
                      <OudWeightChip locale={locale} count={2} kg={25} />
                    </m.span>
                  ))}
                  {boxes.remainder ? (
                    <m.span key="single">
                      <OudWeightChip locale={locale} count={1} kg={20} dashed />
                    </m.span>
                  ) : null}
                </AnimatePresence>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

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

      {showInquiryCard ? (
        <div
          role="status"
          data-testid="ro-shipping-inquiry-card"
          className="space-y-2 rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-sunken px-3.5 py-3 text-sm text-ro-ink"
        >
          <p className="font-medium">
            {t(locale, "اطلب عرض سعر", "Request a quote")}
          </p>
          <p className="text-xs leading-relaxed text-ro-muted">
            {inquiryNote
              ? t(locale, inquiryNote.ar, inquiryNote.en)
              : inquiryReasonLabel(inquiryReason, locale)}
          </p>
          <p className="text-xs text-ro-muted">
            {t(
              locale,
              "أكمل الاسم والهاتف أدناه ثم أرسل الطلب — سنراجع العرض في صندوق الاستفسارات ونعود إليك.",
              "Complete your name and phone below, then submit — we’ll review it in Inquiries and follow up."
            )}
          </p>
          <input type="hidden" name="shippingInquiry" value="1" />
          {inquiryReason ? (
            <input type="hidden" name="shippingInquiryReason" value={inquiryReason} />
          ) : null}
        </div>
      ) : null}

      {options.length > 0 ? (
        <div
          role="radiogroup"
          aria-label={t(locale, "طريقة الشحن", "Shipping method")}
          className="grid gap-2 sm:grid-cols-2"
        >
          {options.map((opt, i) => (
            <MethodCard
              key={opt.code}
              locale={locale}
              opt={opt}
              active={(methodCode ?? options[0]?.code) === opt.code}
              badges={badges.get(opt.code) ?? []}
              index={i}
              onlyOne={options.length === 1}
              onSelect={() => {
                setMethodCode(opt.code);
                emit(opt.code);
              }}
            />
          ))}
        </div>
      ) : null}

      {stickyAmount ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t border-[var(--ro-border-control)] bg-ro-paper/95 px-4 py-3 shadow-[0_-8px_24px_rgba(11,8,13,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3 text-sm">
            <span className="text-ro-muted">
              {t(locale, "تقدير الشحن", "Shipping estimate")}
            </span>
            <bdi dir="ltr" className="font-semibold text-ro-ink">
              {stickyAmount.amount} {stickyAmount.currency}
            </bdi>
          </div>
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
