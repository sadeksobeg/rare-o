"use client";

import { useActionState, useEffect } from "react";
import { adminUpdateCustomerAction } from "@/app/actions";
import type { ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useUnsavedGuard } from "@/lib/ui/use-unsaved-guard";
import { useState } from "react";

const initial: ActionResult | null = null;

export function CustomerEditForm({
  customerId,
  name,
  phone,
  dict,
}: {
  customerId: string;
  name: string;
  phone: string;
  dict: Dictionary;
}) {
  const u = dict.adminUi;
  const [state, action, pending] = useActionState(
    adminUpdateCustomerAction,
    initial
  );
  const [dirty, setDirty] = useState(false);
  useUnsavedGuard(dirty && !(state?.ok));

  useEffect(() => {
    if (state?.ok) setDirty(false);
  }, [state]);

  return (
    <form
      action={action}
      className="ro-portal-card space-y-3 border p-4 md:p-5"
      onChange={() => setDirty(true)}
    >
      <input type="hidden" name="customerId" value={customerId} />
      <h2 className="font-display text-base font-semibold text-[color:var(--ro-text)]">
        {u.customerEditTitle}
      </h2>
      <TextField
        name="name"
        label={u.customerName}
        defaultValue={name}
        required
        dense
      />
      <TextField
        name="phone"
        label={u.colPhone}
        defaultValue={phone}
        required
        dense
        dir="ltr"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" loading={pending}>
          {u.customerEditSave}
        </Button>
        {state?.ok ? (
          <p
            className="text-sm font-medium text-[var(--ro-success-700)]"
            role="status"
          >
            {u.customerEditSaved}
          </p>
        ) : null}
        {state && !state.ok ? (
          <p className="text-sm text-[var(--ro-danger-700)]" role="alert">
            {state.error || u.customerEditFailed}
          </p>
        ) : null}
      </div>
    </form>
  );
}
