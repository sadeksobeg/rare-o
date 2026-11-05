"use client";

import {
  adminResetTraderPasswordAction,
  adminSetTraderStatusAction,
} from "@/app/deal-actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type TempPasswordPayload = { tempPassword: string; email: string };

export function TraderResetPasswordButton({
  traderId,
  label,
  confirmTitle,
  confirmBody,
  confirmLabel,
  cancelLabel,
  tempPasswordTitle,
  tempPasswordLead,
  tempPasswordCopy,
  tempPasswordCopied,
  tempPasswordAck,
  tempPasswordClose,
}: {
  traderId: string;
  label: string;
  confirmTitle: string;
  confirmBody: string;
  confirmLabel: string;
  cancelLabel: string;
  tempPasswordTitle: string;
  tempPasswordLead: string;
  tempPasswordCopy: string;
  tempPasswordCopied: string;
  tempPasswordAck: string;
  tempPasswordClose: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [revealed, setRevealed] = useState<TempPasswordPayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [acked, setAcked] = useState(false);

  function run() {
    const fd = new FormData();
    fd.set("traderId", traderId);
    startTransition(async () => {
      const res = await adminResetTraderPasswordAction(fd);
      setConfirmOpen(false);
      if (res.ok && res.data && typeof res.data === "object") {
        const data = res.data as Partial<TempPasswordPayload>;
        if (
          typeof data.tempPassword === "string" &&
          typeof data.email === "string"
        ) {
          setRevealed({ tempPassword: data.tempPassword, email: data.email });
          setCopied(false);
          setAcked(false);
        }
      }
    });
  }

  async function copyPassword() {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed.tempPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function closeReveal() {
    if (!acked) return;
    setRevealed(null);
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={pending}
        className="h-8 px-3"
        onClick={() => setConfirmOpen(true)}
      >
        {label}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={run}
        title={confirmTitle}
        body={confirmBody}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        pending={pending}
      />
      <Dialog
        open={!!revealed}
        onClose={closeReveal}
        title={tempPasswordTitle}
        preventDismiss={!acked}
      >
        {revealed ? (
          <div className="space-y-4">
            <p className="text-sm text-[color:var(--ro-text-muted)]">
              {tempPasswordLead}
            </p>
            <p className="text-sm" dir="ltr">
              {revealed.email}
            </p>
            <p
              className="rounded-[var(--ro-r-sm)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-sunken)] px-3 py-2 font-mono text-sm tracking-wide text-[color:var(--ro-text)]"
              dir="ltr"
            >
              {revealed.tempPassword}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={copyPassword}
              >
                {copied ? tempPasswordCopied : tempPasswordCopy}
              </Button>
            </div>
            <label className="flex items-start gap-2 text-sm text-[color:var(--ro-text)]">
              <input
                type="checkbox"
                checked={acked}
                onChange={(e) => setAcked(e.target.checked)}
                className="mt-1"
              />
              <span>{tempPasswordAck}</span>
            </label>
            <Button
              type="button"
              size="sm"
              disabled={!acked}
              onClick={closeReveal}
            >
              {tempPasswordClose}
            </Button>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}

export function TraderStatusButton({
  traderId,
  nextStatus,
  label,
  confirmTitle,
  confirmBody,
  confirmLabel,
  cancelLabel,
}: {
  traderId: string;
  nextStatus: "active" | "disabled";
  label: string;
  confirmTitle?: string;
  confirmBody?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const needsConfirm = nextStatus === "disabled";

  function run() {
    const fd = new FormData();
    fd.set("traderId", traderId);
    fd.set("status", nextStatus);
    startTransition(async () => {
      await adminSetTraderStatusAction(fd);
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      {needsConfirm ? (
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={pending}
            className="h-8 px-3"
            onClick={() => setConfirmOpen(true)}
          >
            {label}
          </Button>
          <ConfirmDialog
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={run}
            title={confirmTitle ?? label}
            body={confirmBody ?? label}
            confirmLabel={confirmLabel ?? label}
            cancelLabel={cancelLabel ?? "Cancel"}
            pending={pending}
          />
        </>
      ) : (
        <form
          action={(fd) => {
            startTransition(async () => {
              await adminSetTraderStatusAction(fd);
              router.refresh();
            });
          }}
        >
          <input type="hidden" name="traderId" value={traderId} />
          <input type="hidden" name="status" value={nextStatus} />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            loading={pending}
            className="h-8 px-3"
          >
            {label}
          </Button>
        </form>
      )}
    </>
  );
}
