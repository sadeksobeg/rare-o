"use client";

import { useActionState, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { adminUpdateCustomerAction } from "@/app/actions";
import type { ActionResult } from "@/app/actions";
import { Field, Input } from "@/components/ui-kit";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useUnsavedGuard } from "@/lib/ui/use-unsaved-guard";
import { formatMaskedPhone } from "@/lib/whatsapp/messaging/phone-format";

const initial: ActionResult | null = null;

export function CustomerEditForm({
  customerId,
  name,
  phone,
  dict,
  bare = false,
  locale = "ar",
}: {
  customerId: string;
  name: string;
  phone: string;
  dict: Dictionary;
  /** Skip outer card + heading when wrapped in ui-kit Card. */
  bare?: boolean;
  locale?: string;
}) {
  const u = dict.adminUi;
  const [state, action, pending] = useActionState(
    adminUpdateCustomerAction,
    initial
  );
  const [dirty, setDirty] = useState(false);
  const [revealPhone, setRevealPhone] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState(phone);
  useUnsavedGuard(dirty && !(state?.ok));

  useEffect(() => {
    if (state?.ok) {
      setDirty(false);
      setEditingPhone(false);
      setRevealPhone(false);
    }
  }, [state]);

  useEffect(() => {
    setPhoneValue(phone);
  }, [phone]);

  const masked = formatMaskedPhone(phone) || phone;
  const ar = locale === "ar";

  const form = (
    <form
      action={action}
      className="space-y-3"
      onChange={() => setDirty(true)}
    >
      <input type="hidden" name="customerId" value={customerId} />
      {bare ? null : (
        <h2 className="text-base font-semibold" style={{ color: "var(--rad-tx)" }}>
          {u.customerEditTitle}
        </h2>
      )}
      <Field label={u.customerName}>
        <Input name="name" defaultValue={name} required autoComplete="name" />
      </Field>

      <Field label={u.colPhone}>
        {editingPhone ? (
          <Input
            name="phone"
            value={phoneValue}
            onChange={(e) => setPhoneValue(e.target.value)}
            required
            dir="ltr"
            autoComplete="tel"
          />
        ) : (
          <>
            <input type="hidden" name="phone" value={phone} />
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rad-inp"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 42,
                  flex: 1,
                  cursor: "default",
                }}
              >
                <bdi dir="ltr">{revealPhone ? phone : masked}</bdi>
              </span>
              <button
                type="button"
                className="rad-btn rad-gh rad-sm"
                onClick={() => setRevealPhone((v) => !v)}
                aria-pressed={revealPhone}
              >
                {revealPhone ? (
                  <EyeOff width={14} height={14} strokeWidth={1.5} aria-hidden />
                ) : (
                  <Eye width={14} height={14} strokeWidth={1.5} aria-hidden />
                )}
                {revealPhone ? u.hidePhone : u.showPhone}
              </button>
              <button
                type="button"
                className="rad-btn rad-gh rad-sm"
                onClick={() => {
                  setEditingPhone(true);
                  setDirty(true);
                }}
              >
                {ar ? "تغيير الرقم" : "Change number"}
              </button>
            </div>
          </>
        )}
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="rad-btn rad-pri rad-sm" disabled={pending}>
          {u.customerEditSave}
        </button>
        {state?.ok ? (
          <p
            className="text-sm font-medium"
            style={{ color: "var(--rad-ok)" }}
            role="status"
          >
            {u.customerEditSaved}
          </p>
        ) : null}
        {state && !state.ok ? (
          <p className="text-sm" style={{ color: "var(--rad-err)" }} role="alert">
            {state.error || u.customerEditFailed}
          </p>
        ) : null}
      </div>
    </form>
  );

  if (bare) return form;

  return (
    <div className="rounded-[14px] border p-4 md:p-5" style={{ borderColor: "var(--rad-bd)" }}>
      {form}
    </div>
  );
}
