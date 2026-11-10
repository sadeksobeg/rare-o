"use client";

import { adminCreateTraderAction } from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui-kit/field";
import { Modal } from "@/components/ui-kit/modal";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useUnsavedGuard } from "@/lib/ui/use-unsaved-guard";
import { cn } from "@/lib/utils";
import { Check, Copy, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

const initial: ActionResult | null = null;

type TempPasswordPayload = { tempPassword: string; email: string };

/** Opens create-trader form in the shared portal Modal. */
export function CreateTraderButton({
  dict,
  className,
}: {
  dict: Dictionary;
  className?: string;
}) {
  const u = dict.adminUi;
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    adminCreateTraderAction,
    initial
  );
  const [revealed, setRevealed] = useState<TempPasswordPayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [acked, setAcked] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const router = useRouter();
  useUnsavedGuard(open && dirty && !revealed);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#create-trader") {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!state?.ok || !state.data || typeof state.data !== "object") return;
    const data = state.data as Partial<TempPasswordPayload>;
    if (
      typeof data.tempPassword === "string" &&
      typeof data.email === "string"
    ) {
      setOpen(false);
      setDirty(false);
      setRevealed({ tempPassword: data.tempPassword, email: data.email });
      setCopied(false);
      setAcked(false);
    }
  }, [state]);

  function closeForm() {
    if (pending) return;
    setOpen(false);
    setDirty(false);
    setFormKey((k) => k + 1);
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
    setFormKey((k) => k + 1);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className={cn("rad-btn rad-pri rad-sm inline-flex items-center gap-2", className)}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
        <span>{u.newTrader}</span>
      </button>

      <Modal
        open={open}
        onClose={closeForm}
        title={u.traderCreateTitle}
        className="max-w-[560px]"
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={closeForm}
              disabled={pending}
            >
              {dict.common.cancel}
            </Button>
            <Button
              type="submit"
              form="admin-create-trader"
              size="sm"
              loading={pending}
            >
              {u.traderCreateSubmit}
            </Button>
          </>
        }
      >
        <p className="rad-dim mb-4 text-sm leading-relaxed">{u.traderCreateLead}</p>
        <form
          id="admin-create-trader"
          key={formKey}
          action={action}
          className="space-y-4"
          onChange={() => setDirty(true)}
        >
          <Field label={u.traderEmail}>
            <Input
              name="email"
              type="email"
              required
              dir="ltr"
              autoComplete="off"
            />
          </Field>
          <Field label={u.traderDisplayName}>
            <Input name="displayName" required autoComplete="off" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={u.traderCompany}>
              <Input name="companyName" />
            </Field>
            <Field label={u.traderPhone}>
              <Input name="phone" dir="ltr" inputMode="tel" />
            </Field>
          </div>
          <Field label={u.traderNotes}>
            <Textarea name="adminNotes" rows={3} placeholder={u.traderNotes} />
          </Field>

          {state && !state.ok ? (
            <p className="rad-ferr" role="alert">
              {state.error}
            </p>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={!!revealed}
        onClose={closeReveal}
        title={u.traderTempPasswordTitle}
        actions={
          <Button
            type="button"
            size="sm"
            disabled={!acked}
            onClick={closeReveal}
          >
            {u.traderTempPasswordClose}
          </Button>
        }
      >
        {revealed ? (
          <div className="space-y-4">
            <p className="rad-dim text-sm leading-relaxed">
              {u.traderTempPasswordLead}
            </p>
            <div className="rounded-[12px] border border-[color:var(--rad-bd)] bg-[color:var(--rad-surface3)] p-4">
              <p className="text-xs font-medium text-[color:var(--rad-tx3)]">
                {u.traderEmail}
              </p>
              <p
                className="mt-1 text-sm font-medium text-[color:var(--rad-tx)]"
                dir="ltr"
              >
                {revealed.email}
              </p>
              <p className="mt-4 text-xs font-medium text-[color:var(--rad-tx3)]">
                {u.traderTempPasswordTitle}
              </p>
              <p
                className="mt-1.5 break-all font-mono text-base tracking-wide text-[color:var(--rad-tx)]"
                dir="ltr"
              >
                {revealed.tempPassword}
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={copyPassword}
              >
                {copied ? (
                  <Check className="size-3.5" strokeWidth={1.5} aria-hidden />
                ) : (
                  <Copy className="size-3.5" strokeWidth={1.5} aria-hidden />
                )}
                {copied ? u.traderTempPasswordCopied : u.traderTempPasswordCopy}
              </Button>
            </div>

            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[12px] border border-[color:var(--rad-bd)] px-3 py-3 text-sm text-[color:var(--rad-tx)]">
              <input
                type="checkbox"
                checked={acked}
                onChange={(e) => setAcked(e.target.checked)}
                className="mt-1 size-4 shrink-0 accent-[var(--rad-ac)]"
              />
              <span>{u.traderTempPasswordAck}</span>
            </label>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
