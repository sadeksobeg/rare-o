"use client";

import { traderLoginAction } from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { useActionState } from "react";

const initial: ActionResult | null = null;

export default function TraderLoginPage() {
  const [state, action, pending] = useActionState(traderLoginAction, initial);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ro-ivory px-4">
      <form
        action={action}
        className="w-full max-w-md space-y-4 border border-ro-line bg-ro-surface p-8"
      >
        <h1 className="text-2xl tracking-[0.12em]">Trader sign in</h1>
        <p className="text-sm text-ro-muted">
          Accounts are provisioned by RARE OUD admin. No public registration.
        </p>
        <label className="block space-y-1 text-sm">
          <span>Email</span>
          <input
            name="email"
            type="email"
            required
            className="w-full border border-ro-line bg-transparent px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full border border-ro-line bg-transparent px-3 py-2"
          />
        </label>
        {state && !state.ok ? (
          <p className="text-sm text-red-800">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-ro-purple px-4 py-3 text-sm text-ro-ivory disabled:opacity-60"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
