"use client";

import {
  adminMarkRetailHandoffOpenedAction,
  adminRetriggerRetailHandoffAction,
  adminTransitionRetailRequestAction,
} from "@/app/actions";
import type { RetailRequestStatus } from "@/lib/retail-request/constants";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AdminRequestControls({
  requestId,
  nextStatuses,
  whatsAppDeepLink,
  canRetrigger,
}: {
  requestId: string;
  nextStatuses: RetailRequestStatus[];
  whatsAppDeepLink: string | null;
  canRetrigger: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(whatsAppDeepLink);
  const router = useRouter();

  return (
    <div className="space-y-4 border border-ro-line p-4">
      <h2 className="text-lg">Operations</h2>
      <p className="text-sm text-ro-muted">
        Transitions are server-side and audited. Retrigger regenerates the
        wa.me message on this same request — no duplicate RetailRequest.
      </p>

      {nextStatuses.length > 0 ? (
        <form
          className="flex flex-wrap items-end gap-3"
          action={(fd) => {
            startTransition(async () => {
              setError(null);
              setMessage(null);
              const res = await adminTransitionRetailRequestAction(fd);
              if (!res.ok) setError(res.error);
              else {
                setMessage("Status updated.");
                router.refresh();
              }
            });
          }}
        >
          <input type="hidden" name="requestId" value={requestId} />
          <label className="space-y-1 text-sm">
            <span className="block text-ro-muted">Move to</span>
            <select
              name="toStatus"
              required
              className="border border-ro-line bg-transparent px-3 py-2"
            >
              {nextStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="block text-ro-muted">Note (optional)</span>
            <input
              name="note"
              className="border border-ro-line bg-transparent px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="bg-ro-purple px-4 py-2 text-sm text-ro-ivory disabled:opacity-60"
          >
            Apply transition
          </button>
        </form>
      ) : (
        <p className="text-sm text-ro-muted">Terminal status — no transitions.</p>
      )}

      <div className="flex flex-wrap gap-3">
        {canRetrigger ? (
          <form
            action={(fd) => {
              startTransition(async () => {
                setError(null);
                setMessage(null);
                const res = await adminRetriggerRetailHandoffAction(fd);
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                const data = res.data as
                  | { whatsAppDeepLink?: string | null }
                  | undefined;
                if (data?.whatsAppDeepLink) setLink(data.whatsAppDeepLink);
                setMessage("Handoff regenerated on the same request.");
                router.refresh();
              });
            }}
          >
            <input type="hidden" name="requestId" value={requestId} />
            <button
              type="submit"
              disabled={pending}
              className="border border-ro-line px-4 py-2 text-sm disabled:opacity-60"
            >
              Retrigger handoff
            </button>
          </form>
        ) : null}

        {link ? (
          <form
            action={(fd) => {
              startTransition(async () => {
                setError(null);
                setMessage(null);
                const res = await adminMarkRetailHandoffOpenedAction(fd);
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                const data = res.data as
                  | { whatsAppDeepLink?: string | null }
                  | undefined;
                const openLink = data?.whatsAppDeepLink || link;
                setMessage("Handoff marked opened.");
                router.refresh();
                if (openLink) {
                  window.open(openLink, "_blank", "noopener,noreferrer");
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
              Open WhatsApp handoff
            </button>
          </form>
        ) : null}
      </div>

      {message ? <p className="text-sm text-ro-muted">{message}</p> : null}
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
    </div>
  );
}
