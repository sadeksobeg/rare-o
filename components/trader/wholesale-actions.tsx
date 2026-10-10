"use client";

import {
  traderCancelWholesaleRequestAction,
  traderRespondWholesaleQuoteAction,
} from "@/app/wholesale-actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function TraderWholesaleActions({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4 border border-ro-line p-4">
      <h2 className="text-lg">Actions</h2>
      {status === "quote_provided" ? (
        <div className="space-y-3">
          <p className="text-sm text-ro-muted">
            Review the quotation, then accept (fulfillment intent) or decline.
          </p>
          <form
            className="space-y-3"
            action={(fd) => {
              startTransition(async () => {
                setError(null);
                setMessage(null);
                const res = await traderRespondWholesaleQuoteAction(null, fd);
                if (!res.ok) setError(res.error);
                else {
                  setMessage("Response recorded.");
                  router.refresh();
                }
              });
            }}
          >
            <input type="hidden" name="requestId" value={requestId} />
            <label className="block space-y-1 text-sm">
              <span>Note (optional)</span>
              <input
                name="note"
                className="w-full border border-ro-line bg-transparent px-3 py-2"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                name="accept"
                value="yes"
                disabled={pending}
                className="bg-ro-purple px-4 py-2 text-sm text-ro-ivory disabled:opacity-60"
              >
                Accept quotation
              </button>
              <button
                type="submit"
                name="accept"
                value="no"
                disabled={pending}
                className="border border-ro-line px-4 py-2 text-sm disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {status === "submitted" || status === "under_review" ? (
        <form
          action={(fd) => {
            startTransition(async () => {
              setError(null);
              const res = await traderCancelWholesaleRequestAction(fd);
              if (!res.ok) setError(res.error);
              else {
                setMessage("Request cancelled.");
                router.refresh();
              }
            });
          }}
        >
          <input type="hidden" name="requestId" value={requestId} />
          <button
            type="submit"
            disabled={pending}
            className="border border-ro-line px-4 py-2 text-sm disabled:opacity-60"
          >
            Cancel request
          </button>
        </form>
      ) : null}

      {status !== "quote_provided" &&
      status !== "submitted" &&
      status !== "under_review" ? (
        <p className="text-sm text-ro-muted">No trader actions for this status.</p>
      ) : null}

      {message ? <p className="text-sm text-ro-muted">{message}</p> : null}
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
    </div>
  );
}
