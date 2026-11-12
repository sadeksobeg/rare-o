"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { shippingRevertRateAction } from "@/app/shipping-admin-actions";
import { Button } from "@/components/ui/button";
import { formErrorClass } from "@/lib/ui/form-classes";

export function RateHistoryPanel({
  rateId,
  entries,
  locale,
}: {
  rateId: string;
  locale: string;
  entries: {
    id: string;
    action: string;
    actor: string;
    at: string;
    hasBefore: boolean;
  }[];
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  void rateId;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">{ar ? "سجل التغييرات" : "Change history"}</h2>
      {error ? (
        <p role="alert" className={formErrorClass}>
          {error}
        </p>
      ) : null}
      {!entries.length ? (
        <p className="text-sm text-[color:var(--rad-tx-2)]">
          {ar ? "لا سجل بعد." : "No history yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[color:var(--rad-bd)] px-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium">{e.action}</div>
                <div className="text-xs text-[color:var(--rad-tx-2)]">
                  {e.actor} · <bdi dir="ltr">{new Date(e.at).toLocaleString()}</bdi>
                </div>
              </div>
              {e.hasBefore ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  loading={pending}
                  onClick={() => {
                    if (
                      !window.confirm(
                        ar ? "استرجاع النسخة السابقة؟" : "Revert to the previous version?"
                      )
                    ) {
                      return;
                    }
                    start(async () => {
                      const fd = new FormData();
                      fd.set("historyId", e.id);
                      const res = await shippingRevertRateAction(fd);
                      if (!res.ok) setError(res.error);
                      else router.refresh();
                    });
                  }}
                >
                  {ar ? "استرجاع" : "Revert"}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
