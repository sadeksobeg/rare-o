"use client";

import { useEffect, useActionState } from "react";
import { adminConfirmDealPaymentAction } from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { toastErr, toastOk } from "@/lib/portal/toast";

const initial: ActionResult | null = null;

export function DealPaymentConfirm({
  dealId,
  title,
  body,
  confirmLabel,
}: {
  dealId: string;
  title: string;
  body: string;
  confirmLabel: string;
}) {
  const [state, action, pending] = useActionState(
    adminConfirmDealPaymentAction,
    initial
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) toastOk(confirmLabel);
    else toastErr(state.error);
  }, [state, confirmLabel]);

  return (
    <div className="space-y-3 rounded-[var(--ro-r-lg)] border border-[color:var(--ro-border)] bg-[color:var(--ro-bg-elevated)] p-5">
      <p className="text-sm font-semibold text-[color:var(--ro-text)]">{title}</p>
      <p className="text-xs text-[color:var(--ro-text-muted)]">{body}</p>
      {state && !state.ok ? (
        <p className="text-sm text-[var(--ro-danger-700)]" role="alert">
          {state.error}
        </p>
      ) : null}
      <form action={action}>
        <input type="hidden" name="dealId" value={dealId} />
        <Button type="submit" size="sm" disabled={pending} loading={pending} className="min-h-11">
          {confirmLabel}
        </Button>
      </form>
    </div>
  );
}
