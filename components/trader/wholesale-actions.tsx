"use client";

import {
  traderCancelWholesaleRequestAction,
  traderRespondWholesaleQuoteAction,
} from "@/app/wholesale-actions";
import { ConfirmDialog } from "@/components/ui/dialog";
import { traderActionMessage, type TraderDict } from "@/lib/ui/trader-labels";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export function TraderWholesaleActions({
  requestId,
  status,
  labels: t,
}: {
  requestId: string;
  status: string;
  labels: TraderDict;
}) {
  const router = useRouter();
  const noteRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | "accept" | "decline" | "cancel">(
    null
  );

  function respond(accept: boolean) {
    const fd = new FormData();
    fd.set("requestId", requestId);
    fd.set("accept", accept ? "yes" : "no");
    const note = noteRef.current?.value?.trim();
    if (note) fd.set("note", note);
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const res = await traderRespondWholesaleQuoteAction(null, fd);
      if (!res.ok) setError(traderActionMessage(t, res.error));
      else {
        setMessage(t.wsResponseRecorded);
        router.refresh();
      }
      setConfirm(null);
    });
  }

  function cancel() {
    const fd = new FormData();
    fd.set("requestId", requestId);
    startTransition(async () => {
      setError(null);
      const res = await traderCancelWholesaleRequestAction(fd);
      if (!res.ok) setError(traderActionMessage(t, res.error));
      else {
        setMessage(t.wsCancelled);
        router.refresh();
      }
      setConfirm(null);
    });
  }

  const confirmCopy =
    confirm === "accept"
      ? {
          title: t.wsConfirmAcceptTitle,
          body: t.wsConfirmAcceptBody,
          label: t.wsAccept,
          destructive: false,
        }
      : confirm === "decline"
        ? {
            title: t.wsConfirmDeclineTitle,
            body: t.wsConfirmDeclineBody,
            label: t.wsDecline,
            destructive: true,
          }
        : confirm === "cancel"
          ? {
              title: t.wsConfirmCancelTitle,
              body: t.wsConfirmCancelBody,
              label: t.wsCancel,
              destructive: true,
            }
          : null;

  return (
    <div className="rad-card space-y-4 p-4">
      <h2 className="text-lg font-semibold text-[color:var(--rad-tx)]">
        {t.wsActions}
      </h2>
      {status === "quote_provided" ? (
        <div className="space-y-3">
          <p className="text-sm text-[color:var(--rad-tx3)]">{t.wsReviewQuote}</p>
          <label className="block space-y-1 text-sm text-[color:var(--rad-tx)]">
            <span>{t.wsNoteOptional}</span>
            <input ref={noteRef} name="note" className="rad-inp w-full" />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rad-btn rad-pri"
              disabled={pending}
              onClick={() => setConfirm("accept")}
            >
              {t.wsAccept}
            </button>
            <button
              type="button"
              className="rad-btn rad-gh"
              disabled={pending}
              onClick={() => setConfirm("decline")}
            >
              {t.wsDecline}
            </button>
          </div>
        </div>
      ) : null}

      {status === "submitted" || status === "under_review" ? (
        <button
          type="button"
          className="rad-btn rad-gh"
          disabled={pending}
          onClick={() => setConfirm("cancel")}
        >
          {t.wsCancel}
        </button>
      ) : null}

      {status !== "quote_provided" &&
      status !== "submitted" &&
      status !== "under_review" ? (
        <p className="text-sm text-[color:var(--rad-tx3)]">{t.wsNoActions}</p>
      ) : null}

      {message ? (
        <p className="text-sm text-[color:var(--rad-tx3)]">{message}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-[var(--ro-danger-700)]" role="alert">
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmCopy != null}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm === "accept") respond(true);
          else if (confirm === "decline") respond(false);
          else if (confirm === "cancel") cancel();
        }}
        title={confirmCopy?.title ?? ""}
        body={confirmCopy?.body ?? ""}
        confirmLabel={confirmCopy?.label ?? t.wsAccept}
        cancelLabel={t.confirmCancel}
        pending={pending}
        destructive={confirmCopy?.destructive ?? true}
      />
    </div>
  );
}
