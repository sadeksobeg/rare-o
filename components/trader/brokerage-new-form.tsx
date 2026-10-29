"use client";

import { useActionState } from "react";
import { traderCreateBrokerageAction } from "@/app/brokerage-actions";
import type { ActionResult } from "@/app/actions";
import { BrokeragePhotoField } from "@/components/brokerage/photo-field";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

const initial: ActionResult | null = null;

export function BrokerageNewForm({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const [state, action, pending] = useActionState(
    traderCreateBrokerageAction,
    initial
  );

  return (
    <form
      action={action}
      encType="multipart/form-data"
      className="space-y-4 rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-5"
    >
      <TextField
        name="descriptionAr"
        label={ar ? "وصف القطعة" : "Piece description"}
        required
        minLength={8}
      />
      <BrokeragePhotoField locale={locale} />
      <TextField name="categoryAr" label={ar ? "الفئة" : "Category"} />
      <TextField
        name="quantity"
        type="number"
        label={ar ? "الكمية" : "Quantity"}
        defaultValue="1"
      />
      <TextField name="cityAr" label={ar ? "المدينة" : "City"} />
      <TextField name="placeNameAr" label={ar ? "اسم المكان" : "Place name"} />
      <TextField
        name="sellerContact"
        label={ar ? "تواصل البائع" : "Seller contact"}
      />
      <TextField
        name="sourceUrl"
        label={ar ? "رابط (اختياري)" : "Link (optional)"}
        dir="ltr"
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          name="budgetMinUsd"
          type="number"
          label={ar ? "ميزانية من (USD)" : "Budget min (USD)"}
          dir="ltr"
        />
        <TextField
          name="budgetMaxUsd"
          type="number"
          label={ar ? "إلى" : "Max"}
          dir="ltr"
        />
      </div>
      <TextField name="traderNotes" label={ar ? "ملاحظات" : "Notes"} />
      {state && !state.ok ? (
        <p className="text-sm text-[var(--ro-danger-700)]">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending
          ? ar
            ? "جارٍ الإرسال…"
            : "Submitting…"
          : ar
            ? "إرسال الطلب"
            : "Submit request"}
      </Button>
    </form>
  );
}
