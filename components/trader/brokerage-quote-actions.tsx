"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { traderRespondQuoteAction } from "@/app/brokerage-actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function BrokerageQuoteActions({
  requestId,
  labels: t,
}: {
  requestId: string;
  labels: Dictionary["trader"];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"approve" | "reject" | null>(null);

  function run(decision: "approve" | "reject") {
    const fd = new FormData();
    fd.set("id", requestId);
    fd.set("decision", decision);
    startTransition(async () => {
      setError(null);
      const res = await traderRespondQuoteAction(null, fd);
      if (!res.ok) setError(res.error);
      else router.refresh();
      setConfirm(null);
    });
  }

  return (
    <div className="space-y-3 rounded-[var(--ro-r-lg)] border border-[var(--ro-amber-500)]/40 bg-[var(--ro-amber-100)]/40 p-4">
      <p className="text-sm font-medium text-ro-ink">{t.brokerageQuoteAwaiting}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() => setConfirm("approve")}
        >
          {t.brokerageApprove}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={pending}
          onClick={() => setConfirm("reject")}
        >
          {t.brokerageDecline}
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-[var(--ro-danger-700)]">{error}</p>
      ) : null}

      <ConfirmDialog
        open={confirm === "approve"}
        onClose={() => setConfirm(null)}
        onConfirm={() => run("approve")}
        title={t.brokerageConfirmApproveTitle}
        body={t.brokerageConfirmApproveBody}
        confirmLabel={t.brokerageApprove}
        cancelLabel={t.confirmCancel}
        pending={pending}
        destructive={false}
      />
      <ConfirmDialog
        open={confirm === "reject"}
        onClose={() => setConfirm(null)}
        onConfirm={() => run("reject")}
        title={t.brokerageConfirmDeclineTitle}
        body={t.brokerageConfirmDeclineBody}
        confirmLabel={t.brokerageDecline}
        cancelLabel={t.confirmCancel}
        pending={pending}
      />
    </div>
  );
}
