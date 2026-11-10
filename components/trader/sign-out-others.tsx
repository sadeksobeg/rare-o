"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { traderInvalidateOtherSessionsAction } from "@/app/deal-actions";
import { Banner } from "@/components/ui/banner";
import { ConfirmDialog } from "@/components/ui/dialog";

export function TraderSignOutOthers({
  label,
  title,
  description,
  confirmLabel,
  cancelLabel,
  successLabel,
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  successLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-3">
      {done ? <Banner tone="success">{successLabel}</Banner> : null}
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <button
        type="button"
        className="rad-btn rad-gh"
        disabled={pending}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
        {label}
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        body={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        pending={pending}
        onConfirm={() => {
          start(async () => {
            const res = await traderInvalidateOtherSessionsAction();
            setOpen(false);
            if (!res.ok) {
              setError(res.error ?? "Error");
              return;
            }
            setDone(true);
          });
        }}
      />
    </div>
  );
}
