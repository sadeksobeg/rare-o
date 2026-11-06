"use client";

import { useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { traderOpenDealHandoffAction } from "@/app/deal-actions";
import { traderOpenBrokerageHandoffAction } from "@/app/brokerage-actions";
import { traderOpenWholesaleHandoffAction } from "@/app/wholesale-actions";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-4 rounded-[var(--ro-r-lg)] border border-[color-mix(in_srgb,var(--ro-plum-700)_35%,transparent)] bg-[color-mix(in_srgb,var(--ro-plum-50)_55%,var(--ro-sand-50))] p-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-ro-ink">{title}</h2>
        <p className="mt-1 text-sm text-[var(--ro-ink-600)]">{body}</p>
      </div>
      {messageText ? (
        <pre
          className="max-h-40 overflow-auto whitespace-pre-wrap rounded-[var(--ro-r-sm)] border border-[var(--ro-border-subtle)] bg-ro-paper p-3 text-xs leading-relaxed text-ro-ink"
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
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--ro-r-sm)] bg-[var(--ro-plum-900)] px-6 text-sm font-semibold !text-[var(--ro-sand-100)] transition-[transform,opacity] duration-150 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
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
          <Button type="button" variant="secondary" size="sm" disabled>
            {openLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
