"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Rings } from "@/components/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import { href } from "@/lib/href";
import type { Locale } from "@/lib/i18n/config";

export type HandoffSuccessLabels = {
  title: string;
  referenceLabel: string;
  handoffHint: string;
  nextStep: string;
  messagePreview: string;
  openWhatsApp: string;
  opening: string;
  copyReference: string;
  copyMessage: string;
  copied: string;
  copyFailed: string;
  shippingNote: string;
  catalog: string;
};

type CopyKey = "reference" | "message";

/**
 * Post-submission confirmation for the retail request → WhatsApp handoff.
 * Not a payment confirmation. Copy actions are offered when a prepared
 * deep link / message exists.
 */
export function HandoffSuccess({
  locale,
  labels,
  reference,
  messageText,
  hasDeepLink,
  opening,
  error,
  onOpenWhatsApp,
}: {
  locale: Locale;
  labels: HandoffSuccessLabels;
  reference?: string;
  messageText?: string | null;
  hasDeepLink: boolean;
  opening: boolean;
  error: string | null;
  onOpenWhatsApp: () => void;
}) {
  const [copied, setCopied] = useState<CopyKey | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const copy = async (key: CopyKey, text: string) => {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setCopyFailed(false);
      setCopied(key);
    } catch {
      setCopied(null);
      setCopyFailed(true);
    }
    timer.current = setTimeout(() => {
      setCopied(null);
      setCopyFailed(false);
    }, 2000);
  };

  return (
    <section className="mx-auto max-w-xl space-y-8 text-center">
      <div className="relative mx-auto flex size-28 items-center justify-center">
        <Rings
          idle
          amberRingIndex={5}
          className="absolute inset-0 size-full text-ro-ink opacity-60"
        />
        <Check className="relative size-8 text-ro-plum" aria-hidden />
      </div>

      <div className="space-y-3" role="status" aria-live="polite">
        <h1 className="ro-type-h1">{labels.title}</h1>
        {reference ? (
          <p className="text-sm text-ro-muted">
            {labels.referenceLabel}{" "}
            <bdi className="font-semibold tabular-nums text-ro-ink">
              {reference}
            </bdi>
          </p>
        ) : null}
        <p className="mx-auto max-w-md text-sm leading-relaxed text-ro-text-2">
          {labels.handoffHint}
        </p>
      </div>

      {hasDeepLink ? (
        <div className="space-y-3">
          <p className="text-sm text-ro-text-2">{labels.nextStep}</p>
          <Button
            size="lg"
            className="w-full sm:w-auto"
            loading={opening}
            onClick={onOpenWhatsApp}
          >
            {opening ? labels.opening : labels.openWhatsApp}
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-[var(--ro-danger-700)]" role="alert">
          {error}
        </p>
      ) : null}

      {messageText ? (
        <div className="space-y-2 text-start">
          <p className="text-sm text-ro-muted">{labels.messagePreview}</p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-[var(--ro-r-sm)] border border-ro-line bg-ro-surface p-4 text-xs leading-relaxed">
            {messageText}
          </pre>
        </div>
      ) : null}

      {reference || messageText ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {reference ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copy("reference", reference)}
            >
              {copied === "reference" ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
              {copied === "reference" ? labels.copied : labels.copyReference}
            </Button>
          ) : null}
          {messageText && hasDeepLink ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copy("message", messageText)}
            >
              {copied === "message" ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
              {copied === "message" ? labels.copied : labels.copyMessage}
            </Button>
          ) : null}
          <span className="sr-only" aria-live="polite">
            {copyFailed ? labels.copyFailed : copied ? labels.copied : ""}
          </span>
          {copyFailed ? (
            <span className="text-xs text-[var(--ro-danger-700)]" aria-hidden>
              {labels.copyFailed}
            </span>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs leading-relaxed text-ro-muted">
        {labels.shippingNote}
      </p>

      <ButtonLink href={href("/catalog", locale)} variant="text" size="sm">
        {labels.catalog}
      </ButtonLink>
    </section>
  );
}