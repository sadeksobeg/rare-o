"use client";

import {
  adminMarkRetailHandoffOpenedAction,
  adminRetriggerRetailHandoffAction,
  adminTransitionRetailRequestAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { RetailRequestStatus } from "@/lib/retail-request/constants";
import {
  controlClass,
  controlLabelClass,
  controlLabelTextClass,
  formErrorClass,
} from "@/lib/ui/form-classes";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AdminRequestControls({
  requestId,
  nextStatuses,
  whatsAppDeepLink,
  canRetrigger,
  labels,
}: {
  requestId: string;
  nextStatuses: RetailRequestStatus[];
  whatsAppDeepLink: string | null;
  canRetrigger: boolean;
  labels: Dictionary["adminUi"];
}) {
  const f = labels.form;
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(whatsAppDeepLink);
  const router = useRouter();

  return (
    <div className="space-y-4 border border-ro-line p-4">
      <h2 className="text-lg font-semibold">{f.operations}</h2>
      <p className="text-sm text-ro-muted">{f.operationsHint}</p>

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
                  {labels.status.retail[s] ?? s}
                </option>
              ))}
            </select>
          </label>
          <label className={controlLabelClass}>
            <span className={controlLabelTextClass}>{f.noteOptional}</span>
            <input name="note" className={controlClass} />
          </label>
          <Button type="submit" size="sm" loading={pending}>
            {f.applyTransition}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-ro-muted">{f.terminalNoTransitions}</p>
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
                setMessage(f.handoffRegenerated);
                router.refresh();
              });
            }}
          >
            <input type="hidden" name="requestId" value={requestId} />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={pending}
            >
              {f.retrigger}
            </Button>
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
                setMessage(f.handoffMarkedOpened);
                router.refresh();
                if (openLink) {
                  window.open(openLink, "_blank", "noopener,noreferrer");
                }
              });
            }}
          >
            <input type="hidden" name="requestId" value={requestId} />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={pending}
            >
              {f.openHandoff}
            </Button>
          </form>
        ) : null}
      </div>

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
