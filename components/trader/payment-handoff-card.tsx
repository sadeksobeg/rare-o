"use client";

import { useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { traderOpenDealHandoffAction } from "@/app/deal-actions";
import { traderOpenBrokerageHandoffAction } from "@/app/brokerage-actions";
import { traderOpenWholesaleHandoffAction } from "@/app/wholesale-actions";

/**
 * Trader-facing WhatsApp payment deep-link card (deals + brokerage).
 * Marks handoff opened via server action; never sends via Baileys.
 */
export function PaymentHandoffCard({
  kind,
  recordId,
  title,
  body,
  openLabel,
  unavailableLabel,
  deepLink,
  messageText,
}: {
  kind: "deal" | "brokerage" | "wholesale";
  recordId: string;
  title: string;
  body: string;
  openLabel: string;
  unavailableLabel: string;
  deepLink: string | null;
  messageText: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rad-card space-y-4 border-[color-mix(in_srgb,var(--rad-ac)_35%,var(--rad-bd))] bg-[color-mix(in_srgb,var(--rad-ac)_6%,var(--rad-surface))] p-5">
      <div>
        <h2 className="text-lg font-semibold text-[color:var(--rad-tx)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[color:var(--rad-tx2)]">{body}</p>
      </div>
      {messageText ? (
        <pre
          className="max-h-40 overflow-auto whitespace-pre-wrap rounded-[var(--rad-r-sm)] border border-[color:var(--rad-bd)] bg-[color:var(--rad-surface2)] p-3 text-xs leading-relaxed text-[color:var(--rad-tx)]"
          dir="auto"
        >
          {messageText}
        </pre>
      ) : null}
      {deepLink ? (
        <a
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="rad-btn rad-pri"
          onClick={() => {
            startTransition(async () => {
              const fd = new FormData();
              if (kind === "deal") {
                fd.set("dealId", recordId);
                await traderOpenDealHandoffAction(fd);
              } else if (kind === "brokerage") {
                fd.set("id", recordId);
                await traderOpenBrokerageHandoffAction(fd);
              } else {
                fd.set("requestId", recordId);
                await traderOpenWholesaleHandoffAction(fd);
              }
            });
          }}
        >
          <MessageCircle className="size-4" strokeWidth={1.5} aria-hidden />
          {pending ? "…" : openLabel}
        </a>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--ro-amber-800)]">
            {unavailableLabel}
          </p>
          <button type="button" className="rad-btn rad-gh rad-sm" disabled>
            {openLabel}
          </button>
        </div>
      )}
    </div>
  );
}
