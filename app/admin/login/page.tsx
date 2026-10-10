"use client";

import { useActionState } from "react";
import { adminLoginAction, type ActionResult } from "@/app/actions";

const initial: ActionResult | null = null;

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(adminLoginAction, initial);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="mb-6 text-2xl tracking-[0.15em]">RARE OUD Admin</h1>
      <form action={action} className="space-y-4 border border-ro-line p-6">
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
          className="w-full bg-ro-purple py-3 text-sm text-ro-ivory disabled:opacity-60"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
