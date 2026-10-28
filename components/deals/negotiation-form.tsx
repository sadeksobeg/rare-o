"use client";

import {
  adminNegotiateAction,
  traderNegotiateAction,
} from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { traderActionMessage, type TraderDict } from "@/lib/ui/trader-labels";

const fieldClass =
  "w-full rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 py-2.5 text-sm font-medium text-ro-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]";

type ConflictWarning = {
  reference: string;
  traderDisplayName: string;
  status: string;
};

function actionLeading(action: string): ReactNode {
  switch (action) {
    case "counter":
      return <RefreshCw className="size-4" strokeWidth={2} aria-hidden />;
    case "accept":
      return <CheckCircle2 className="size-4" strokeWidth={2} aria-hidden />;
    case "reject":
      return <XCircle className="size-4" strokeWidth={2} aria-hidden />;
    case "close":
      return <Ban className="size-4" strokeWidth={2} aria-hidden />;
    default:
      return <MessageSquare className="size-4" strokeWidth={2} aria-hidden />;
  }
}

/** Structured negotiation action bar (A19) — not free chat. */
export function NegotiationForm({
  dealId,
  mode,
  labels,
  currency,
}: {
  dealId: string;
  mode: "trader" | "admin";
  /** Optional bilingual labels (trader portal). Admin keeps English defaults. */
  labels?: TraderDict;
  currency?: string | null;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const skipConfirm = useRef(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [action, setAction] = useState("continue");
  const [warnings, setWarnings] = useState<ConflictWarning[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const needsConfirm =
    action === "accept" || action === "close" || action === "reject";
  const confirmTitle =
    action === "accept"
      ? (labels?.negConfirmAcceptTitle ?? "Accept this deal?")
      : action === "close"
        ? (labels?.negConfirmCloseTitle ?? "Close this deal?")
        : (labels?.negConfirmRejectTitle ?? "Reject this deal?");
  const confirmBody =
    action === "accept"
      ? (labels?.negConfirmAcceptBody ??
        "Accepting locks negotiation and records agreement to the current terms.")
      : action === "close"
        ? (labels?.negConfirmCloseBody ??
          "Closing ends negotiation without accepting.")
        : (labels?.negConfirmRejectBody ?? "Rejecting ends the deal.");

  return (
    <form
      ref={formRef}
      className="ro-portal-card space-y-4 border p-4 md:p-5"
      data-component="negotiation-action-bar"
      onSubmit={(e) => {
        if (needsConfirm && !skipConfirm.current) {
          e.preventDefault();
          setConfirmOpen(true);
        }
        skipConfirm.current = false;
      }}
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
        <h3 className="ro-portal-section-title flex items-center gap-2 text-base">
          <span className="ro-portal-icon-well size-8 [&>svg]:size-4" aria-hidden>
            {actionLeading(action)}
          </span>
          {labels?.negTitle ?? "Negotiation response"}
        </h3>
        <p className="ro-portal-muted">
          {labels?.negHint ??
            "Structured negotiation — not chat. Choose continue, counter, accept, reject, or close."}
        </p>
      </div>
      <input type="hidden" name="dealId" value={dealId} />
      <label className="block space-y-1.5 text-sm font-semibold">
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
      <label className="block space-y-1.5 text-sm font-semibold">
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
          <label className="block space-y-1.5 text-sm font-semibold">
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
          <label className="block space-y-1.5 text-sm font-semibold">
            <span className="text-ro-muted">
              {labels?.negCurrency ?? "Currency"}
            </span>
            <input
              name="currency"
              placeholder={currency || undefined}
              defaultValue={currency ?? ""}
              dir="ltr"
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1.5 text-sm font-semibold">
            <span className="text-ro-muted">{labels?.negQty ?? "Quantity"}</span>
            <input
              name="quantity"
              type="number"
              min="1"
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1.5 text-sm font-semibold sm:col-span-3">
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
          className="flex gap-2.5 border border-[color-mix(in_srgb,var(--ro-amber-800)_28%,transparent)] bg-[var(--ro-amber-100)] p-3 text-sm"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-[var(--ro-amber-800)]"
            strokeWidth={2}
            aria-hidden
          />
          <div className="space-y-1">
            <p className="font-bold text-[var(--ro-amber-800)]">
              {labels?.conflictWarningTitle ??
                "Warning: other active catalog deals on this product"}
            </p>
            <ul className="list-inside list-disc font-medium text-ro-muted">
              {warnings.map((w) => (
                <li key={w.reference}>
                  {w.reference} · {w.traderDisplayName} · {w.status}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      {result && !result.ok ? (
        <p className="text-sm font-semibold text-[var(--ro-danger-700)]" role="alert">
          {labels ? traderActionMessage(labels, result.error) : result.error}
        </p>
      ) : null}
      {result?.ok ? (
        <p className="text-sm font-semibold text-ro-muted">
          {labels?.negRecorded ?? "Negotiation entry recorded."}
        </p>
      ) : null}
      <Button type="submit" variant="primary" size="md" disabled={pending}>
        <Send className="size-4" strokeWidth={2} aria-hidden />
        {labels?.negSubmit ?? "Submit entry"}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          skipConfirm.current = true;
          setConfirmOpen(false);
          formRef.current?.requestSubmit();
        }}
        title={confirmTitle}
        body={confirmBody}
        confirmLabel={
          action === "accept"
            ? (labels?.dealAction.accept ?? "Accept")
            : action === "close"
              ? (labels?.dealAction.close ?? "Close")
              : (labels?.dealAction.reject ?? "Reject")
        }
        cancelLabel={labels?.confirmCancel ?? "Cancel"}
        pending={pending}
        destructive={action !== "accept"}
      />
    </form>
  );
}
