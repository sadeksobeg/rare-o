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

type ConflictWarning = {
  reference: string;
  traderDisplayName: string;
  status: string;
};

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
  const [warnings, setWarnings] = useState<ConflictWarning[]>([]);

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
          if (res.ok) {
            const data = res.data as
              | { conflictWarnings?: ConflictWarning[] }
              | undefined;
            setWarnings(data?.conflictWarnings ?? []);
            router.refresh();
          } else {
            setWarnings([]);
          }
        });
      }}
    >
      <div className="space-y-1">
        <h3 className="text-base font-semibold">
          {labels?.negTitle ?? "Negotiation response"}
        </h3>
        <p className="text-sm text-ro-muted">
          {labels?.negHint ??
            "Structured negotiation — not chat. Choose continue, counter, accept, reject, or close."}
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
          {mode === "admin" ? (
            <option value="reject">
              {labels?.dealAction.reject ?? "Reject"}
            </option>
          ) : null}
          <option value="close">{labels?.dealAction.close ?? "Close"}</option>
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-ro-muted">
          {action === "reject"
            ? (labels?.negRejectReason ?? "Reject reason (optional)")
            : (labels?.negMessage ?? "Message")}
        </span>
        <textarea
          name="message"
          rows={3}
          className={fieldClass}
          placeholder={
            action === "reject"
              ? (labels?.negRejectReasonHint ??
                "Optional reason shown to the trader")
              : undefined
          }
        />
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
      {warnings.length > 0 ? (
        <div
          role="status"
          data-conflict-warning="1"
          className="space-y-1 border border-[var(--ro-attention-border,var(--ro-line))] bg-[var(--ro-attention-bg,var(--ro-paper))] p-3 text-sm"
        >
          <p className="font-semibold">
            {labels?.conflictWarningTitle ??
              "Warning: other active catalog deals on this product"}
          </p>
          <ul className="list-inside list-disc text-ro-muted">
            {warnings.map((w) => (
              <li key={w.reference}>
                {w.reference} · {w.traderDisplayName} · {w.status}
              </li>
            ))}
          </ul>
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
