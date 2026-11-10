"use client";

import {
  adminResetTraderPasswordAction,
  adminSetTraderStatusAction,
} from "@/app/deal-actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui-kit/modal";
import { Check, Copy } from "lucide-react";
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
        className="!min-w-0 rounded-[11px] px-3"
        onClick={() => setConfirmOpen(true)}
      >
        {label}
      </Button>
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={confirmTitle}
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setConfirmOpen(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={pending}
              onClick={run}
            >
              {confirmLabel}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-[color:var(--rad-tx2)]">
          {confirmBody}
        </p>
      </Modal>
      <Modal
        open={!!revealed}
        onClose={closeReveal}
        title={tempPasswordTitle}
        actions={
          <Button
            type="button"
            size="sm"
            disabled={!acked}
            onClick={closeReveal}
          >
            {tempPasswordClose}
          </Button>
        }
      >
        {revealed ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-[color:var(--rad-tx2)]">
              {tempPasswordLead}
            </p>
            <p className="text-sm" dir="ltr">
              {revealed.email}
            </p>
            <p
              className="rounded-[11px] border border-[color:var(--rad-bd)] bg-[color:var(--rad-surface3)] px-3 py-2 font-mono text-sm tracking-wide text-[color:var(--rad-tx)]"
              dir="ltr"
            >
              {revealed.tempPassword}
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={copyPassword}
            >
              {copied ? (
                <Check className="size-3.5" strokeWidth={1.5} aria-hidden />
              ) : (
                <Copy className="size-3.5" strokeWidth={1.5} aria-hidden />
              )}
              {copied ? tempPasswordCopied : tempPasswordCopy}
            </Button>
            <label className="flex items-start gap-2 text-sm text-[color:var(--rad-tx)]">
              <input
                type="checkbox"
                checked={acked}
                onChange={(e) => setAcked(e.target.checked)}
                className="mt-1 accent-[var(--rad-ac)]"
              />
              <span>{tempPasswordAck}</span>
            </label>
          </div>
        ) : null}
      </Modal>
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
            className="!min-w-0 rounded-[11px] px-3"
            onClick={() => setConfirmOpen(true)}
          >
            {label}
          </Button>
          <Modal
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            title={confirmTitle ?? label}
            actions={
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmOpen(false)}
                >
                  {cancelLabel ?? "Cancel"}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  loading={pending}
                  onClick={run}
                >
                  {confirmLabel ?? label}
                </Button>
              </>
            }
          >
            <p className="text-sm leading-relaxed text-[color:var(--rad-tx2)]">
              {confirmBody ?? label}
            </p>
          </Modal>
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
            className="!min-w-0 rounded-[11px] px-3"
          >
            {label}
          </Button>
        </form>
      )}
    </>
  );
}
