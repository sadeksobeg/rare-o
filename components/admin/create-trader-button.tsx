"use client";

import { adminCreateTraderAction } from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  controlClass,
  controlLabelClass,
  controlLabelTextClass,
} from "@/lib/ui/form-classes";
import { useUnsavedGuard } from "@/lib/ui/use-unsaved-guard";
import { Check, Copy, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

const initial: ActionResult | null = null;

type TempPasswordPayload = { tempPassword: string; email: string };

/** Opens create-trader form in a dialog — not inline on the list page. */
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
      <Button
        type="button"
        variant="primary"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-3.5" strokeWidth={1.5} aria-hidden />
        {u.newTrader}
      </Button>

      <Dialog
        open={open}
        onClose={closeForm}
        title={u.traderCreateTitle}
        description={u.traderCreateLead}
        size="md"
        preventDismiss={dirty && pending}
      >
        <form
          key={formKey}
          action={action}
          className="space-y-5"
          onChange={() => setDirty(true)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField
                name="email"
                type="email"
                label={u.traderEmail}
                required
                dense
                dir="ltr"
                autoComplete="off"
              />
            </div>
            <div className="sm:col-span-2">
              <TextField
                name="displayName"
                label={u.traderDisplayName}
                required
                dense
                autoComplete="off"
              />
            </div>
            <TextField name="companyName" label={u.traderCompany} dense />
            <TextField
              name="phone"
              label={u.traderPhone}
              dense
              dir="ltr"
              inputMode="tel"
            />
            <div className="sm:col-span-2">
              <label className={controlLabelClass}>
                <span className={controlLabelTextClass}>{u.traderNotes}</span>
                <textarea
                  name="adminNotes"
                  rows={3}
                  className={controlClass}
                  placeholder={u.traderNotes}
                />
              </label>
            </div>
          </div>

          {state && !state.ok ? (
            <p
              className="rounded-[10px] border border-[color:color-mix(in_srgb,var(--ro-danger-700)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--ro-danger-700)_10%,transparent)] px-3 py-2 text-sm text-[var(--ro-danger-700)]"
              role="alert"
            >
              {state.error}
            </p>
          ) : null}

          <div className="-mx-5 -mb-4 flex flex-wrap items-center justify-end gap-2 border-t border-[color:var(--ro-border-subtle)] bg-[color:color-mix(in_srgb,var(--ro-bg-sunken)_55%,transparent)] px-5 py-3.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={closeForm}
              disabled={pending}
            >
              {dict.common.cancel}
            </Button>
            <Button type="submit" size="sm" loading={pending}>
              {u.traderCreateSubmit}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={!!revealed}
        onClose={closeReveal}
        title={u.traderTempPasswordTitle}
        description={u.traderTempPasswordLead}
        size="sm"
        preventDismiss={!acked}
      >
        {revealed ? (
          <div className="space-y-4">
            <div className="rounded-[12px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-sunken)] p-4">
              <p className="text-xs font-medium text-[color:var(--ro-text-muted)]">
                {u.traderEmail}
              </p>
              <p className="mt-1 text-sm font-medium text-[color:var(--ro-text)]" dir="ltr">
                {revealed.email}
              </p>
              <p className="mt-4 text-xs font-medium text-[color:var(--ro-text-muted)]">
                {u.traderTempPasswordTitle}
              </p>
              <p
                className="mt-1.5 break-all font-mono text-base tracking-wide text-[color:var(--ro-text)]"
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

            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[12px] border border-[color:var(--ro-border-subtle)] px-3 py-3 text-sm text-[color:var(--ro-text)]">
              <input
                type="checkbox"
                checked={acked}
                onChange={(e) => setAcked(e.target.checked)}
                className="mt-1 size-4 shrink-0 accent-[var(--ro-plum-900)]"
              />
              <span>{u.traderTempPasswordAck}</span>
            </label>

            <div className="-mx-5 -mb-4 border-t border-[color:var(--ro-border-subtle)] px-5 py-3.5">
              <Button
                type="button"
                size="sm"
                className="w-full sm:w-auto"
                disabled={!acked}
                onClick={closeReveal}
              >
                {u.traderTempPasswordClose}
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
