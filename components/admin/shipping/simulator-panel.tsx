"use client";

import { useMemo, useState, useTransition } from "react";
import { shippingSimulateQuoteAction } from "@/app/shipping-admin-actions";
import { DestinationCombobox } from "@/components/storefront/shipping/destination-combobox";
import { CountryFlagWithFallback } from "@/components/storefront/shipping/flag";
import { MethodCard } from "@/components/storefront/shipping/method-card";
import { WeightText } from "@/components/storefront/shipping/weight-text";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Field, Select } from "@/components/ui-kit/field";
import {
  computeMethodBadges,
  inquiryReasonLabel,
  modeLabel,
  securityLabel,
  speedLabel,
  tidyMethodLabel,
  weightSourceLabel,
  type QuoteMethodUi,
} from "@/lib/shipping/quote-ui";
import type { Locale } from "@/lib/i18n/config";
import { formErrorClass } from "@/lib/ui/form-classes";

type QuoteData = {
  destinationCode: string;
  destination: { nameAr: string; nameEn: string; note: string } | null;
  weightKg: number | null;
  weightSource: string;
  inquiry: boolean;
  inquiryReason: string | null;
  methods: Array<{
    methodCode: string;
    labelAr: string;
    labelEn: string;
    mode?: string;
    speed?: string | null;
    security?: string | null;
    consolidation?: boolean;
    price: { total: number; currency: string; base: number; handling: number };
    unverified: boolean;
    warnings: string[];
  }>;
};

export function SimulatorPanel({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const loc = (ar ? "ar" : "en") as Locale;
  const [result, setResult] = useState<QuoteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [destinationCode, setDestinationCode] = useState("JO");
  const [customerPreview, setCustomerPreview] = useState(false);

  const customerMethods: QuoteMethodUi[] = useMemo(() => {
    if (!result) return [];
    return result.methods.map((m) => ({
      code: m.methodCode,
      labelAr: tidyMethodLabel(m.labelAr),
      labelEn: tidyMethodLabel(m.labelEn),
      mode: m.mode ?? null,
      speed: m.speed ?? null,
      security: m.security ?? null,
      consolidation: Boolean(m.consolidation),
      note: null,
      amount: m.price.total,
      currency: m.price.currency,
      alternate: null,
    }));
  }, [result]);

  const badges = useMemo(
    () => computeMethodBadges(customerMethods),
    [customerMethods]
  );

  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("destinationCode", destinationCode);
          setError(null);
          start(async () => {
            const res = await shippingSimulateQuoteAction(fd);
            if (!res.ok) {
              setError(res.error);
              setResult(null);
              return;
            }
            setResult(res.data as QuoteData);
          });
        }}
      >
        <div className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">
            {ar ? "الوجهة" : "Destination"}
          </span>
          <DestinationCombobox
            locale={loc}
            value={destinationCode}
            onChange={(code) => setDestinationCode(code)}
            portalTone="admin"
            dense
          />
        </div>
        <TextField
          name="weightKg"
          label={ar ? "الوزن المحتسب (كغ)" : "Billable weight (kg)"}
          type="number"
          step="0.1"
          defaultValue="20"
          dense
          dir="ltr"
        />
        <Field label={ar ? "الجمهور" : "Audience"}>
          <Select name="audience" defaultValue="CUSTOMER">
            <option value="CUSTOMER">{ar ? "عميل" : "Customer"}</option>
            <option value="TRADER">{ar ? "تاجر" : "Trader"}</option>
          </Select>
        </Field>
        <label className="flex min-h-11 items-end gap-2 pb-2 text-sm">
          <input type="checkbox" name="includeUnverified" className="size-4" defaultChecked />
          {ar ? "تضمين غير المعتمد" : "Include unverified"}
        </label>
        <label className="flex min-h-11 items-end gap-2 pb-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            className="size-4"
            checked={customerPreview}
            onChange={(e) => setCustomerPreview(e.target.checked)}
          />
          {ar
            ? "معاينة كما يراها العميل (بطاقات حقيقية)"
            : "Customer-card preview"}
        </label>
        <div className="sm:col-span-2 lg:col-span-4">
          <Button type="submit" loading={pending}>
            {ar ? "جرّب السعر" : "Run quote"}
          </Button>
        </div>
      </form>

      {error ? (
        <p role="alert" className={formErrorClass}>
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="space-y-3 rounded-lg border border-[color:var(--rad-bd)] p-4">
          <p
            data-testid="ro-sim-result-header"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[color:var(--rad-tx-2)]"
          >
            <span className="inline-flex items-center gap-1.5 font-medium text-[color:var(--rad-tx)]">
              <CountryFlagWithFallback
                code={result.destinationCode}
                title={
                  result.destination
                    ? result.destination.nameEn || result.destination.nameAr
                    : result.destinationCode
                }
              />
              {result.destination
                ? ar
                  ? result.destination.nameAr
                  : result.destination.nameEn || result.destination.nameAr
                : ar
                  ? "وجهة غير معروفة"
                  : "Unknown destination"}
            </span>
            <span aria-hidden>·</span>
            <WeightText kg={result.weightKg} locale={loc} className="inline-flex" />
            <span aria-hidden>·</span>
            {weightSourceLabel(result.weightSource, loc)}
          </p>

          {customerPreview ? (
            <div
              data-testid="ro-sim-customer-preview"
              className="relative space-y-3 rounded-lg border border-dashed border-[color:var(--rad-bd)] bg-[color:var(--rad-c0)] p-3"
            >
              <p className="text-center text-xs font-semibold tracking-wide text-[color:var(--rad-tx-2)]">
                {ar ? "معاينة — غير معتمد" : "Preview — unverified"}
              </p>
              {result.inquiry && customerMethods.length === 0 ? (
                <p className="rounded-md bg-[color:var(--rad-c1)] px-3 py-2 text-sm">
                  {ar ? "اطلب عرض سعر" : "Request a quote"}
                  {" — "}
                  {inquiryReasonLabel(result.inquiryReason, loc)}
                </p>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-2">
                {customerMethods.map((opt, i) => (
                  <div key={opt.code} className="relative">
                    <MethodCard
                      locale={loc}
                      opt={opt}
                      active={i === 0}
                      badges={badges.get(opt.code) ?? []}
                      index={i}
                      onlyOne={customerMethods.length === 1}
                      onSelect={() => undefined}
                    />
                    {result.methods[i]?.unverified ? (
                      <span className="absolute start-2 top-2 rounded bg-[color:var(--rad-warn, #b45309)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {ar ? "غير معتمد" : "Unverified"}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {result.inquiry ? (
                <p className="rounded-md bg-[color:var(--rad-c1)] px-3 py-2 text-sm">
                  {ar ? "اطلب عرض سعر" : "Request a quote"}
                  {" — "}
                  {inquiryReasonLabel(result.inquiryReason, loc)}
                </p>
              ) : null}
              {result.methods.length === 0 && !result.inquiry ? (
                <p className="text-sm">{ar ? "لا طرق متاحة." : "No methods available."}</p>
              ) : null}
              <ul className="space-y-2">
                {result.methods.map((m) => (
                  <li
                    key={m.methodCode}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[color:var(--rad-bd)] px-3 py-2"
                  >
                    <div>
                      <div className="font-medium">
                        {ar
                          ? tidyMethodLabel(m.labelAr)
                          : tidyMethodLabel(m.labelEn || m.labelAr)}
                      </div>
                      <div className="text-xs text-[color:var(--rad-tx-2)]">
                        <bdi dir="ltr">{m.methodCode}</bdi>
                        {m.mode ? ` · ${modeLabel(m.mode, loc)}` : ""}
                        {m.speed ? ` · ${speedLabel(m.speed, loc)}` : ""}
                        {m.security ? ` · ${securityLabel(m.security, loc)}` : ""}
                        {m.consolidation
                          ? ar
                            ? " · تجميع"
                            : " · consolidation"
                          : ""}
                        {m.unverified ? (
                          <span className="ms-1 inline-flex rounded bg-[color:var(--rad-c1)] px-1.5 py-0.5 text-[10px] font-semibold">
                            {ar ? "غير معتمد" : "UNVERIFIED"}
                          </span>
                        ) : null}
                        {m.warnings.length ? ` · ${m.warnings.join(", ")}` : ""}
                      </div>
                    </div>
                    <bdi dir="ltr" className="font-semibold">
                      {m.price.total} {m.price.currency}
                    </bdi>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
