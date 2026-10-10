"use client";

import {
  adminProvideWholesaleQuoteAction,
  adminTransitionWholesaleAction,
} from "@/app/wholesale-actions";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  controlClass,
  controlLabelClass,
  controlLabelTextClass,
  formErrorClass,
} from "@/lib/ui/form-classes";
import { WHOLESALE_TRANSITIONS, type WholesaleStatus } from "@/lib/wholesale/constants";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

export function AdminWholesaleControls({
  requestId,
  status,
  requestMode,
  lines,
  quoteCurrencyDefault,
  labels,
}: {
  requestId: string;
  status: string;
  requestMode: string;
  /** `productName` is already resolved for the viewer's locale. */
  lines: Array<{ id: string; productName: string; quantity: number }>;
  quoteCurrencyDefault: string;
  labels: Dictionary["adminUi"];
}) {
  const f = labels.form;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});

  const nextStatuses = useMemo(() => {
    const current = status as WholesaleStatus;
    return WHOLESALE_TRANSITIONS[current] ?? [];
  }, [status]);

  const lineQuotesJson = JSON.stringify(
    lines.map((l) => ({
      lineId: l.id,
      quotedUnitPrice: Number(prices[l.id] || 0),
    }))
  );

  const canQuote =
    status === "submitted" ||
    status === "under_review" ||
    status === "quote_provided";

  return (
    <div className="space-y-6 border border-ro-line p-4">
      <h2 className="text-lg font-semibold">{f.adminOperations}</h2>

      {nextStatuses.length > 0 ? (
        <form
          className="flex flex-wrap items-end gap-3"
          action={(fd) => {
            startTransition(async () => {
              setError(null);
              setMessage(null);
              const res = await adminTransitionWholesaleAction(fd);
              if (!res.ok) setError(res.error);
              else {
                setMessage(f.statusUpdated);
                router.refresh();
              }
            });
          }}
        >
          <input type="hidden" name="requestId" value={requestId} />
          <label className={controlLabelClass}>
            <span className={controlLabelTextClass}>{f.moveTo}</span>
            <select name="toStatus" required className={controlClass}>
              {nextStatuses.map((s) => (
                <option key={s} value={s}>
                  {labels.status.wholesale[s] ?? s}
                  {s === "confirmed" &&
                  status === "under_review" &&
                  requestMode === "request_quote"
                    ? ` ${f.blockedUntilQuote}`
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <label className={controlLabelClass}>
            <span className={controlLabelTextClass}>{f.note}</span>
            <input name="note" className={controlClass} />
          </label>
          <Button type="submit" size="sm" loading={pending}>
            {f.apply}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-ro-muted">{f.terminalStatus}</p>
      )}

      {canQuote ? (
        <form
          className="space-y-3 border-t border-ro-line pt-4"
          action={(fd) => {
            startTransition(async () => {
              setError(null);
              setMessage(null);
              const res = await adminProvideWholesaleQuoteAction(null, fd);
              if (!res.ok) setError(res.error);
              else {
                setMessage(f.quoteSaved);
                router.refresh();
              }
            });
          }}
        >
          <h3 className="text-base font-semibold">{f.provideQuote}</h3>
          <p className="text-sm text-ro-muted">{f.quoteHint}</p>
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="lineQuotesJson" value={lineQuotesJson} />
          <label className={`${controlLabelClass} max-w-xs`}>
            <span className={controlLabelTextClass}>{f.quoteCurrency}</span>
            <input
              name="quoteCurrency"
              required
              dir="ltr"
              defaultValue={quoteCurrencyDefault}
              className={controlClass}
            />
          </label>
          <div className="space-y-2">
            {lines.map((l) => (
              <label
                key={l.id}
                className="flex flex-wrap items-center gap-3 text-sm"
              >
                <span className="min-w-[12rem]">
                  {l.productName} × {l.quantity}
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  dir="ltr"
                  aria-label={`${f.quotedUnitPrice} — ${l.productName}`}
                  placeholder={f.quotedUnitPrice}
                  value={prices[l.id] ?? ""}
                  onChange={(e) =>
                    setPrices((prev) => ({ ...prev, [l.id]: e.target.value }))
                  }
                  className={`${controlClass} w-44`}
                />
              </label>
            ))}
          </div>
          <label className={controlLabelClass}>
            <span className={controlLabelTextClass}>{f.quoteMessage}</span>
            <textarea name="quoteMessage" rows={3} className={controlClass} />
          </label>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            loading={pending}
          >
            {f.saveQuote}
          </Button>
        </form>
      ) : null}

      {message ? (
        <p role="status" className="text-sm text-ro-muted">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className={formErrorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
