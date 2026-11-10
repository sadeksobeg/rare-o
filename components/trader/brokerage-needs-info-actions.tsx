"use client";

import { useActionState } from "react";
import { traderResubmitBrokerageAction } from "@/app/brokerage-actions";
import type { ActionResult } from "@/app/actions";
import { BrokeragePhotoField } from "@/components/brokerage/photo-field";

const initial: ActionResult | null = null;

export function BrokerageNeedsInfoActions({
  requestId,
  locale,
  alreadyPhotoCount = 0,
}: {
  requestId: string;
  locale: string;
  alreadyPhotoCount?: number;
}) {
  const ar = locale === "ar";
  const [state, action, pending] = useActionState(
    traderResubmitBrokerageAction,
    initial
  );
  return (
    <div className="rad-card space-y-3 border-[color-mix(in_srgb,var(--ro-amber-500)_40%,var(--rad-bd))] bg-[color-mix(in_srgb,var(--ro-amber-100)_18%,var(--rad-surface))] p-4">
      <p className="text-sm font-medium text-[color:var(--rad-tx)]">
        {ar
          ? "الإدارة تطلب معلومات إضافية — أرفق صوراً إن لزم ثم أعد الإرسال"
          : "Admin needs more info — attach photos if needed, then resubmit"}
      </p>
      <form action={action} encType="multipart/form-data" className="space-y-3">
        <input type="hidden" name="id" value={requestId} />
        <BrokeragePhotoField
          locale={locale}
          alreadyCount={alreadyPhotoCount}
        />
        <button
          type="submit"
          disabled={pending}
          className="rad-btn rad-pri rad-sm min-h-11"
        >
          {ar ? "إعادة التقديم" : "Resubmit"}
        </button>
      </form>
      {state && !state.ok ? (
        <p className="text-sm text-[var(--ro-danger-700)]">{state.error}</p>
      ) : null}
    </div>
  );
}
