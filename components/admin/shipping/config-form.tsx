"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { shippingSaveConfigAction } from "@/app/shipping-admin-actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Field, Select } from "@/components/ui-kit/field";
import { formErrorClass } from "@/lib/ui/form-classes";

export type ConfigValues = {
  roundingRule: string;
  volumetricDivisor: number | null;
  packagingKg: number;
  globalFreeShippingOver: number | null;
  insuranceEnabled: boolean;
  insurancePercent: number | null;
  whatsappOptInTextAr: string;
  whatsappOptInTextEn: string;
  inquiryNoteAr: string;
  inquiryNoteEn: string;
};

export function ConfigForm({
  values,
  locale,
}: {
  values: ConfigValues;
  locale: string;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form
      className="grid max-w-3xl gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        setOk(false);
        start(async () => {
          const res = await shippingSaveConfigAction(fd);
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setOk(true);
          router.refresh();
        });
      }}
    >
      <Field label={ar ? "قاعدة التقريب" : "Rounding rule"}>
        <Select name="roundingRule" defaultValue={values.roundingRule}>
          <option value="legacy_2dp">legacy_2dp</option>
          <option value="ceil_unit">ceil_unit</option>
          <option value="ceil_5">ceil_5</option>
          <option value="none">none</option>
        </Select>
      </Field>
      <TextField
        name="packagingKg"
        label={ar ? "وزن التغليف (كغ/طرد)" : "Packaging kg / parcel"}
        type="number"
        step="0.01"
        defaultValue={values.packagingKg}
        dense
        dir="ltr"
      />
      <TextField
        name="volumetricDivisor"
        label={ar ? "مقسوم الحجم" : "Volumetric divisor"}
        type="number"
        defaultValue={values.volumetricDivisor ?? ""}
        dense
        dir="ltr"
      />
      <TextField
        name="globalFreeShippingOver"
        label={ar ? "شحن مجاني عالمي فوق" : "Global free shipping over"}
        type="number"
        step="0.01"
        defaultValue={values.globalFreeShippingOver ?? ""}
        dense
        dir="ltr"
      />
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="insuranceEnabled"
          defaultChecked={values.insuranceEnabled}
          className="size-4"
        />
        {ar ? "تفعيل التأمين" : "Enable insurance"}
      </label>
      <TextField
        name="insurancePercent"
        label={ar ? "نسبة التأمين %" : "Insurance %"}
        type="number"
        step="0.01"
        defaultValue={values.insurancePercent ?? ""}
        dense
        dir="ltr"
      />
      <TextField
        name="inquiryNoteAr"
        label={ar ? "نص طلب عرض السعر (عربي)" : "Inquiry note (AR)"}
        defaultValue={values.inquiryNoteAr}
        dense
      />
      <TextField
        name="inquiryNoteEn"
        label={ar ? "نص طلب عرض السعر (إنجليزي)" : "Inquiry note (EN)"}
        defaultValue={values.inquiryNoteEn}
        dense
        dir="ltr"
      />
      <TextField
        name="whatsappOptInTextAr"
        label={ar ? "نص موافقة واتساب (عربي)" : "WhatsApp opt-in (AR)"}
        defaultValue={values.whatsappOptInTextAr}
        dense
      />
      <TextField
        name="whatsappOptInTextEn"
        label={ar ? "نص موافقة واتساب (إنجليزي)" : "WhatsApp opt-in (EN)"}
        defaultValue={values.whatsappOptInTextEn}
        dense
        dir="ltr"
      />
      {error ? (
        <p role="alert" className={formErrorClass}>
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="text-sm text-[color:var(--rad-ok,#3d8)]">{ar ? "تم الحفظ." : "Saved."}</p>
      ) : null}
      <Button type="submit" loading={pending}>
        {ar ? "حفظ الإعدادات" : "Save config"}
      </Button>
    </form>
  );
}
