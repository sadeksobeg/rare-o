"use client";

import {
  adminNegotiateAction,
  traderNegotiateAction,
} from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function NegotiationForm({
  dealId,
  mode,
}: {
  dealId: string;
  mode: "trader" | "admin";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [action, setAction] = useState("continue");

  return (
    <form
      className="space-y-4 border border-ro-line p-4"
      action={(fd) => {
        startTransition(async () => {
          const res =
            mode === "admin"
              ? await adminNegotiateAction(null, fd)
              : await traderNegotiateAction(null, fd);
          setResult(res);
          if (res.ok) router.refresh();
        });
      }}
    >
      <h2 className="text-lg">Negotiation response</h2>
      <p className="text-sm text-ro-muted">
        Structured negotiation — not chat. Choose continue, counter, accept, or
        close.
      </p>
      <input type="hidden" name="dealId" value={dealId} />
      <label className="block space-y-1 text-sm">
        <span>Action</span>
        <select
          name="action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="w-full border border-ro-line bg-transparent px-3 py-2"
        >
          <option value="continue">Continue</option>
          <option value="counter">Counter</option>
          <option value="accept">Accept</option>
          <option value="close">Close</option>
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        <span>Message</span>
        <textarea
          name="message"
          rows={3}
          className="w-full border border-ro-line bg-transparent px-3 py-2"
        />
      </label>
      {action === "counter" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1 text-sm">
            <span>Proposed price</span>
            <input
              name="proposedPrice"
              type="number"
              step="0.01"
              min="0"
              className="w-full border border-ro-line bg-transparent px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Currency</span>
            <input
              name="currency"
              placeholder="e.g. USD"
              className="w-full border border-ro-line bg-transparent px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Quantity</span>
            <input
              name="quantity"
              type="number"
              min="1"
              className="w-full border border-ro-line bg-transparent px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm sm:col-span-3">
            <span>Conditions / notes</span>
            <textarea
              name="conditionsNotes"
              rows={2}
              className="w-full border border-ro-line bg-transparent px-3 py-2"
            />
          </label>
        </div>
      ) : null}
      {result && !result.ok ? (
        <p className="text-sm text-red-800">{result.error}</p>
      ) : null}
      {result?.ok ? (
        <p className="text-sm text-ro-muted">Negotiation entry recorded.</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-ro-purple px-4 py-2 text-sm text-ro-ivory disabled:opacity-60"
      >
        Submit entry
      </button>
    </form>
  );
}
