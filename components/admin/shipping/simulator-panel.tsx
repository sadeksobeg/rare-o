"use client";

import { useState, useTransition } from "react";
import { shippingSimulateQuoteAction } from "@/app/shipping-admin-actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Field, Select } from "@/components/ui-kit/field";
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
    price: { total: number; currency: string; base: number; handling: number };
    unverified: boolean;
    warnings: string[];
  }>;
};

export function SimulatorPanel({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const [result, setResult] = useState<QuoteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
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
        <TextField name="destinationCode" label={ar ? "الوجهة" : "Destination"} placeholder="JO" required dense dir="ltr" />
        <TextField name="weightKg" label={ar ? "الوزن الحجمي (كيلو حجمي)" : "Volumetric weight (vol. kg)"} type="number" step="0.1" defaultValue="5" dense dir="ltr" />
        <Field label={ar ? "الجمهور" : "Audience"}>
          <Select name="audience" defaultValue="CUSTOMER">
            <option value="CUSTOMER">{ar ? "عميل" : "Customer"}</option>
            <option value="TRADER">{ar ? "تاجر" : "Trader"}</option>
          </Select>
        </Field>
        <label className="flex min-h-11 items-end gap-2 pb-2 text-sm">
          <input type="checkbox" name="includeUnverified" className="size-4" />
          {ar ? "شمل غير المعتمد" : "Include unverified"}
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
          <p className="text-sm text-[color:var(--rad-tx-2)]">
            <bdi dir="ltr">{result.destinationCode}</bdi>
            {result.destination
              ? ` · ${ar ? result.destination.nameAr : result.destination.nameEn || result.destination.nameAr}`
              : ""}
            {" · "}
            {ar ? "كيلو حجمي" : "vol. kg"}{" "}
            <bdi dir="ltr">{result.weightKg ?? "—"}</bdi> ({result.weightSource})
          </p>
          {result.inquiry ? (
            <p className="rounded-md bg-[color:var(--rad-c1)] px-3 py-2 text-sm">
              {ar ? "اطلب عرض سعر" : "Request a quote"}
              {result.inquiryReason ? ` · ${result.inquiryReason}` : ""}
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
                  <div className="font-medium">{ar ? m.labelAr : m.labelEn || m.labelAr}</div>
                  <div className="text-xs text-[color:var(--rad-tx-2)]">
                    <bdi dir="ltr">{m.methodCode}</bdi>
                    {m.unverified ? (ar ? " · غير معتمد" : " · unverified") : ""}
                    {m.warnings.length ? ` · ${m.warnings.join(", ")}` : ""}
                  </div>
                </div>
                <bdi dir="ltr" className="font-semibold">
                  {m.price.total} {m.price.currency}
                </bdi>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
