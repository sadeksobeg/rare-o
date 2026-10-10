"use client";

import {
  adminCreateTraderAction,
  adminSetTraderStatusAction,
} from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";

const initial: ActionResult | null = null;

export function CreateTraderForm() {
  const [state, action, pending] = useActionState(
    adminCreateTraderAction,
    initial
  );

  return (
    <form action={action} className="grid max-w-xl gap-3 border border-ro-line p-4">
      <h2 className="text-lg">Create trader account</h2>
      <p className="text-sm text-ro-muted">
        Admin-provisioned only. No public self-registration.
      </p>
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className="border border-ro-line bg-transparent px-3 py-2 text-sm"
      />
      <input
        name="password"
        type="password"
        required
        minLength={8}
        placeholder="Temporary password (min 8)"
        className="border border-ro-line bg-transparent px-3 py-2 text-sm"
      />
      <input
        name="displayName"
        required
        placeholder="Display name"
        className="border border-ro-line bg-transparent px-3 py-2 text-sm"
      />
      <input
        name="companyName"
        placeholder="Company (optional)"
        className="border border-ro-line bg-transparent px-3 py-2 text-sm"
      />
      <input
        name="phone"
        placeholder="Phone (optional)"
        className="border border-ro-line bg-transparent px-3 py-2 text-sm"
      />
      <textarea
        name="adminNotes"
        placeholder="Admin notes"
        rows={2}
        className="border border-ro-line bg-transparent px-3 py-2 text-sm"
      />
      {state && !state.ok ? (
        <p className="text-sm text-red-800">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-ro-muted">{state.message ?? "Created."}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-ro-purple px-4 py-2 text-sm text-ro-ivory disabled:opacity-60"
      >
        Create trader
      </button>
    </form>
  );
}

export function TraderStatusButton({
  traderId,
  nextStatus,
}: {
  traderId: string;
  nextStatus: "active" | "disabled";
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
      <button
        type="submit"
        disabled={pending}
        className="border border-ro-line px-3 py-1 text-xs disabled:opacity-60"
      >
        Set {nextStatus}
      </button>
    </form>
  );
}
