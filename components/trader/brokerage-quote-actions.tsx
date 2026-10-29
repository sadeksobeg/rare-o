"use client";

import { useActionState } from "react";
import { traderRespondQuoteAction } from "@/app/brokerage-actions";
import type { ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";

const initial: ActionResult | null = null;

export function BrokerageQuoteActions({
  requestId,
  locale,
}: {
  requestId: string;
  locale: string;
}) {
  const ar = locale === "ar";
  const [state, action, pending] = useActionState(
    traderRespondQuoteAction,
    initial
  );

  return (
    <div className="space-y-3 rounded-[var(--ro-r-lg)] border border-[var(--ro-amber-500)]/40 bg-[var(--ro-amber-100)]/40 p-4">
      <p className="text-sm font-medium text-ro-ink">
        {ar ? "العرض بانتظار قرارك" : "Quote awaiting your decision"}
      </p>
      <div className="flex flex-wrap gap-2">
        <form action={action}>
          <input type="hidden" name="id" value={requestId} />
          <input type="hidden" name="decision" value="approve" />
          <Button type="submit" disabled={pending}>
            {ar ? "موافقة" : "Approve"}
          </Button>
        </form>
        <form action={action}>
          <input type="hidden" name="id" value={requestId} />
          <input type="hidden" name="decision" value="reject" />
          <Button type="submit" variant="danger" disabled={pending}>
            {ar ? "رفض العرض" : "Decline quote"}
          </Button>
        </form>
      </div>
      {state && !state.ok ? (
        <p className="text-sm text-[var(--ro-danger-700)]">{state.error}</p>
      ) : null}
    </div>
  );
}
