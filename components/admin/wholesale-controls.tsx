"use client";

import {
  adminProvideWholesaleQuoteAction,
  adminTransitionWholesaleAction,
  adminUpdateWholesaleShippingAction,
} from "@/app/wholesale-actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TextField, Textarea } from "@/components/ui/text-field";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formErrorClass } from "@/lib/ui/form-classes";
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
          <Select
            name="toStatus"
            label={f.moveTo}
            required
            dense
            className="min-w-[12rem]"
            options={nextStatuses.map((s) => ({
              value: s,
              label:
                (labels.status.wholesale[s] ?? s) +
                (s === "confirmed" &&
                status === "under_review" &&
                requestMode === "request_quote"
                  ? ` ${f.blockedUntilQuote}`
                  : ""),
            }))}
          />
          <TextField
            name="note"
            label={f.note}
            dense
            className="min-w-[12rem] flex-1"
          />
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
          <TextField
            name="quoteCurrency"
            label={f.quoteCurrency}
            required
            dir="ltr"
            defaultValue={quoteCurrencyDefault}
            dense
            className="max-w-xs"
          />
          <div className="space-y-2">
            {lines.map((l) => (
              <TextField
                key={l.id}
                name={`price-${l.id}`}
                type="number"
                min={0}
                step="0.01"
                required
                dir="ltr"
                label={`${l.productName} × ${l.quantity}`}
                placeholder={f.quotedUnitPrice}
                value={prices[l.id] ?? ""}
                onChange={(e) =>
                  setPrices((prev) => ({ ...prev, [l.id]: e.target.value }))
                }
                dense
                className="max-w-sm"
              />
            ))}
          </div>
          <Textarea
            name="quoteMessage"
            label={f.quoteMessage}
            rows={3}
            dense
          />
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

      {status === "confirmed" || status === "completed" ? (
        <form
          className="space-y-3 border-t border-ro-line pt-4"
          action={(fd) => {
            startTransition(async () => {
              setError(null);
              setMessage(null);
              const res = await adminUpdateWholesaleShippingAction(fd);
              if (!res.ok) setError(res.error);
              else {
                setMessage(f.shippingSaved);
                router.refresh();
              }
            });
          }}
        >
          <h3 className="text-base font-semibold">{f.shippingTitle}</h3>
          <input type="hidden" name="requestId" value={requestId} />
          <TextField name="carrier" label={f.carrier} required dense />
          <TextField
            name="trackingReference"
            label={f.trackingReference}
            required
            dir="ltr"
            dense
          />
          <Button type="submit" variant="secondary" size="sm" loading={pending}>
            {f.saveShipping}
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
