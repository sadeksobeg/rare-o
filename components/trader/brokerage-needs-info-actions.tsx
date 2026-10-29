"use client";

import { useActionState } from "react";
import { traderResubmitBrokerageAction } from "@/app/brokerage-actions";
import type { ActionResult } from "@/app/actions";
import { BrokeragePhotoField } from "@/components/brokerage/photo-field";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-3 rounded-[var(--ro-r-lg)] border border-[var(--ro-amber-500)]/40 bg-[var(--ro-amber-100)]/50 p-4">
      <p className="text-sm font-medium">
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
        <Button type="submit" disabled={pending} size="sm" className="min-h-11">
          {ar ? "إعادة التقديم" : "Resubmit"}
        </Button>
      </form>
      {state && !state.ok ? (
        <p className="text-sm text-[var(--ro-danger-700)]">{state.error}</p>
      ) : null}
    </div>
  );
}
