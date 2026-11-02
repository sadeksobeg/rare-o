"use client";

import {
  adminCreateTraderAction,
  adminResetTraderPasswordAction,
  adminSetTraderStatusAction,
} from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useUnsavedGuard } from "@/lib/ui/use-unsaved-guard";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";

const initial: ActionResult | null = null;

const controlClass =
  "w-full rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 py-2 text-sm text-ro-ink outline-none focus:border-[var(--ro-plum-900)]";

type TempPasswordPayload = { tempPassword: string; email: string };

export function CreateTraderForm({ dict }: { dict: Dictionary }) {
  const u = dict.adminUi;
  const [state, action, pending] = useActionState(
    adminCreateTraderAction,
    initial
  );
  const [revealed, setRevealed] = useState<TempPasswordPayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [acked, setAcked] = useState(false);
  const [dirty, setDirty] = useState(false);
  const router = useRouter();
  useUnsavedGuard(dirty && !revealed);

  useEffect(() => {
    if (!state?.ok || !state.data || typeof state.data !== "object") return;
    const data = state.data as Partial<TempPasswordPayload>;
    if (typeof data.tempPassword === "string" && typeof data.email === "string") {
      setRevealed({ tempPassword: data.tempPassword, email: data.email });
      setCopied(false);
      setAcked(false);
      setDirty(false);
    }
  }, [state]);

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
      <form
        action={action}
        className="grid max-w-xl gap-3 border border-ro-line bg-ro-surface p-4"
        onChange={() => setDirty(true)}
      >
        <h2 className="text-lg font-semibold">{u.traderCreateTitle}</h2>
        <p className="text-sm text-ro-muted">{u.traderCreateLead}</p>
        <TextField
          name="email"
          type="email"
          label={u.traderEmail}
          required
          dense
          dir="ltr"
        />
        <TextField
          name="displayName"
          label={u.traderDisplayName}
          required
          dense
        />
        <TextField name="companyName" label={u.traderCompany} dense />
        <TextField name="phone" label={u.traderPhone} dense dir="ltr" />
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-ro-ink">{u.traderNotes}</span>
          <textarea name="adminNotes" rows={2} className={controlClass} />
        </label>
        {state && !state.ok ? (
          <p className="text-sm text-[var(--ro-danger-700)]" role="alert">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" size="sm" loading={pending} className="w-fit">
          {u.traderCreateSubmit}
        </Button>
      </form>

      <Dialog
        open={!!revealed}
        onClose={closeReveal}
        title={u.traderTempPasswordTitle}
        preventDismiss={!acked}
      >
        {revealed ? (
          <div className="space-y-4">
            <p className="text-sm text-ro-muted">{u.traderTempPasswordLead}</p>
            <p className="text-sm" dir="ltr">
              {revealed.email}
            </p>
            <p
              className="rounded-[var(--ro-r-sm)] border border-ro-line bg-ro-paper px-3 py-2 font-mono text-sm tracking-wide"
              dir="ltr"
            >
              {revealed.tempPassword}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={copyPassword}>
                {copied ? u.traderTempPasswordCopied : u.traderTempPasswordCopy}
              </Button>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={acked}
                onChange={(e) => setAcked(e.target.checked)}
                className="mt-1"
              />
              <span>{u.traderTempPasswordAck}</span>
            </label>
            <Button
              type="button"
              size="sm"
              disabled={!acked}
              onClick={closeReveal}
            >
              {u.traderTempPasswordClose}
            </Button>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}

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
            <p className="text-sm text-ro-muted">{tempPasswordLead}</p>
            <p className="text-sm" dir="ltr">
              {revealed.email}
            </p>
            <p
              className="rounded-[var(--ro-r-sm)] border border-ro-line bg-ro-paper px-3 py-2 font-mono text-sm tracking-wide"
              dir="ltr"
            >
              {revealed.tempPassword}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={copyPassword}>
                {copied ? tempPasswordCopied : tempPasswordCopy}
              </Button>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={acked}
                onChange={(e) => setAcked(e.target.checked)}
                className="mt-1"
              />
              <span>{tempPasswordAck}</span>
            </label>
            <Button type="button" size="sm" disabled={!acked} onClick={closeReveal}>
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
