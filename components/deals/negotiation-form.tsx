"use client";

import {
  adminNegotiateAction,
  traderNegotiateAction,
} from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { TraderDict } from "@/lib/ui/trader-labels";

const fieldClass =
  "w-full rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 py-2.5 text-sm text-ro-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]";

/** Structured negotiation action bar (A19) — not free chat. */
export function NegotiationForm({
  dealId,
  mode,
  labels,
}: {
  dealId: string;
  mode: "trader" | "admin";
  /** Optional bilingual labels (trader portal). Admin keeps English defaults. */
  labels?: TraderDict;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [action, setAction] = useState("continue");

  return (
    <form
      className="space-y-4 border border-ro-line bg-ro-surface p-4"
      data-component="negotiation-action-bar"
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
      <div className="space-y-1">
        <h3 className="text-base font-semibold">
          {labels?.negTitle ?? "Negotiation response"}
        </h3>
        <p className="text-sm text-ro-muted">
          {labels?.negHint ??
            "Structured negotiation — not chat. Choose continue, counter, accept, or close."}
        </p>
      </div>
      <input type="hidden" name="dealId" value={dealId} />
      <label className="block space-y-1 text-sm">
        <span className="text-ro-muted">{labels?.negAction ?? "Action"}</span>
        <select
          name="action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className={fieldClass}
        >
          <option value="continue">
            {labels?.dealAction.continue ?? "Continue"}
          </option>
          <option value="counter">
            {labels?.dealAction.counter ?? "Counter"}
          </option>
          <option value="accept">
            {labels?.dealAction.accept ?? "Accept"}
          </option>
          <option value="close">{labels?.dealAction.close ?? "Close"}</option>
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-ro-muted">{labels?.negMessage ?? "Message"}</span>
        <textarea name="message" rows={3} className={fieldClass} />
      </label>
      {action === "counter" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1 text-sm">
            <span className="text-ro-muted">
              {labels?.negPrice ?? "Proposed price"}
            </span>
            <input
              name="proposedPrice"
              type="number"
              step="0.01"
              min="0"
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-ro-muted">
              {labels?.negCurrency ?? "Currency"}
            </span>
            <input
              name="currency"
              placeholder="USD"
              dir="ltr"
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-ro-muted">{labels?.negQty ?? "Quantity"}</span>
            <input
              name="quantity"
              type="number"
              min="1"
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1 text-sm sm:col-span-3">
            <span className="text-ro-muted">
              {labels?.negConditions ?? "Conditions / notes"}
            </span>
            <textarea name="conditionsNotes" rows={2} className={fieldClass} />
          </label>
        </div>
      ) : null}
      {result && !result.ok ? (
        <p className="text-sm text-[var(--ro-danger-700)]" role="alert">
          {result.error}
        </p>
      ) : null}
      {result?.ok ? (
        <p className="text-sm text-ro-muted">
          {labels?.negRecorded ?? "Negotiation entry recorded."}
        </p>
      ) : null}
      <Button type="submit" variant="primary" size="md" disabled={pending}>
        {labels?.negSubmit ?? "Submit entry"}
      </Button>
    </form>
  );
}
