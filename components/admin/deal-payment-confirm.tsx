"use client";

import { useEffect, useActionState, useState } from "react";
import { BadgeCheck, HandCoins } from "lucide-react";
import { adminConfirmDealPaymentAction } from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { Modal, PayNote } from "@/components/ui-kit";
import { toastErr, toastOk } from "@/lib/portal/toast";

const initial: ActionResult | null = null;

export function DealPaymentConfirm({
  dealId,
  title,
  body,
  confirmLabel,
  cancelLabel,
  modalTitle,
  modalBody,
}: {
  dealId: string;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  modalTitle?: string;
  modalBody?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    adminConfirmDealPaymentAction,
    initial
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toastOk(confirmLabel);
      setOpen(false);
    } else toastErr(state.error);
  }, [state, confirmLabel]);

  return (
    <>
      <PayNote
        icon={<HandCoins width={20} height={20} strokeWidth={1.5} aria-hidden />}
      >
        <b>{title}</b>
        <br />
        {body}
      </PayNote>
      <button
        type="button"
        className="rad-btn rad-pri"
        style={{ marginBlockEnd: 18 }}
        onClick={() => setOpen(true)}
      >
        <BadgeCheck width={16} height={16} strokeWidth={1.5} aria-hidden />
        {confirmLabel}
      </button>

      <Modal
        open={open}
        onClose={() => {
          if (!pending) setOpen(false);
        }}
        title={modalTitle ?? title}
        actions={
          <>
            <button
              type="button"
              className="rad-btn rad-gh"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              {cancelLabel ?? "Cancel"}
            </button>
            <form action={action}>
              <input type="hidden" name="dealId" value={dealId} />
              <button
                type="submit"
                className="rad-btn rad-pri"
                disabled={pending}
              >
                <BadgeCheck width={16} height={16} strokeWidth={1.5} aria-hidden />
                {confirmLabel}
              </button>
            </form>
          </>
        }
      >
        <p>{modalBody ?? body}</p>
        {state && !state.ok ? (
          <p role="alert" style={{ color: "var(--rad-err)", marginTop: 10 }}>
            {state.error}
          </p>
        ) : null}
      </Modal>
    </>
  );
}
