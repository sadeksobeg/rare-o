"use client";

import {
  adminCreateTraderAction,
  adminSetTraderStatusAction,
} from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";

const initial: ActionResult | null = null;

const controlClass =
  "w-full rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 py-2 text-sm text-ro-ink outline-none focus:border-[var(--ro-plum-900)]";

export function CreateTraderForm({ dict }: { dict: Dictionary }) {
  const u = dict.adminUi;
  const [state, action, pending] = useActionState(
    adminCreateTraderAction,
    initial
  );

  return (
    <form
      action={action}
      className="grid max-w-xl gap-3 border border-ro-line bg-ro-surface p-4"
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
        name="password"
        type="password"
        label={u.traderPassword}
        required
        minLength={8}
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
      {state?.ok ? (
        <p className="text-sm text-ro-muted" role="status">
          {state.message ?? u.traderCreated}
        </p>
      ) : null}
      <Button type="submit" size="sm" loading={pending} className="w-fit">
        {u.traderCreateSubmit}
      </Button>
    </form>
  );
}

export function TraderStatusButton({
  traderId,
  nextStatus,
  label,
}: {
  traderId: string;
  nextStatus: "active" | "disabled";
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
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
  );
}
