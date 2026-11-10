"use client";

import { useActionState, useEffect, useState } from "react";
import { adminUpdateTraderProfileAction } from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  controlClass,
  controlLabelClass,
  controlLabelTextClass,
} from "@/lib/ui/form-classes";
import { useUnsavedGuard } from "@/lib/ui/use-unsaved-guard";

const initial: ActionResult | null = null;

export function TraderEditForm({
  traderId,
  displayName,
  companyName,
  phone,
  adminNotes,
  interestNotes,
  selectedSlugs,
  categories,
  dict,
}: {
  traderId: string;
  displayName: string;
  companyName: string;
  phone: string;
  adminNotes: string;
  interestNotes: string;
  selectedSlugs: string[];
  categories: Array<{ slug: string; name: string }>;
  dict: Dictionary;
}) {
  const u = dict.adminUi;
  const [state, action, pending] = useActionState(
    adminUpdateTraderProfileAction,
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
      <input type="hidden" name="traderId" value={traderId} />
      <h2 className="font-display text-base font-semibold text-[color:var(--ro-text)]">
        {u.traderEditTitle}
      </h2>
      <TextField
        name="displayName"
        label={u.traderDisplayName}
        defaultValue={displayName}
        required
        dense
      />
      <TextField
        name="companyName"
        label={u.traderCompany}
        defaultValue={companyName}
        dense
      />
      <TextField
        name="phone"
        label={u.traderPhone}
        defaultValue={phone}
        dense
        dir="ltr"
      />

      {categories.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className={controlLabelTextClass}>{u.traderInterests}</legend>
          <div className="flex flex-wrap gap-3">
            {categories.map((c) => (
              <label
                key={c.slug}
                className="inline-flex min-h-11 items-center gap-2 text-sm text-[color:var(--ro-text)]"
              >
                <input
                  type="checkbox"
                  name="interestCategorySlugs"
                  value={c.slug}
                  defaultChecked={selectedSlugs.includes(c.slug)}
                />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <label className={controlLabelClass}>
        <span className={controlLabelTextClass}>{u.traderInterestNotes}</span>
        <textarea
          name="interestNotes"
          rows={3}
          defaultValue={interestNotes}
          maxLength={2000}
          className={controlClass}
        />
      </label>

      <label className={controlLabelClass}>
        <span className={controlLabelTextClass}>{u.traderNotes}</span>
        <textarea
          name="adminNotes"
          rows={3}
          defaultValue={adminNotes}
          maxLength={2000}
          className={controlClass}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" loading={pending}>
          {u.traderEditSave}
        </Button>
        {state?.ok ? (
          <p
            className="text-sm font-medium text-[var(--ro-success-700)]"
            role="status"
          >
            {u.traderEditSaved}
          </p>
        ) : null}
        {state && !state.ok ? (
          <p className="text-sm text-[var(--ro-danger-700)]" role="alert">
            {state.error || u.traderEditFailed}
          </p>
        ) : null}
      </div>
    </form>
  );
}
