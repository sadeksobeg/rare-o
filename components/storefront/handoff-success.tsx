"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "motion/react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Rings } from "@/components/brand";
import { useMotion } from "@/components/motion/provider";
import { OrderJourney } from "@/components/storefront/order-journey";
import { ButtonLink } from "@/components/ui/button";
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

/**
 * Post-submission screen for the retail request → WhatsApp handoff.
 * Not a payment confirmation. The prepared message text is deliberately NOT
 * shown (the WhatsApp button carries it) — the page shows the whole journey.
 */
export function HandoffSuccess({
  locale,
  labels,
  reference,
  hasDeepLink,
  opening,
  error,
  onOpenWhatsApp,
  orderToken,
}: {
  locale: Locale;
  labels: HandoffSuccessLabels;
  reference?: string;
  messageText?: string | null;
  hasDeepLink: boolean;
  opening: boolean;
  error: string | null;
  onOpenWhatsApp: () => void;
  orderToken?: string | null;
}) {
  const { lite } = useMotion();
  const ar = locale === "ar";
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const copyRef = async () => {
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
    } catch {
      setCopied(false);
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="mx-auto max-w-2xl space-y-8">
      <m.div
        initial={lite ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#150b21] via-[#2a1340] to-[#52277c] px-6 py-12 text-center text-white shadow-[0_30px_80px_-30px_rgba(82,39,124,0.7)] sm:px-12"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 start-1/2 size-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,150,62,0.35),transparent_65%)]"
        />
        <Rings
          idle
          amberRingIndex={5}
          className="pointer-events-none absolute inset-0 size-full text-white opacity-[0.08]"
        />

        <div className="relative mx-auto flex size-24 items-center justify-center">
          <span aria-hidden className="ro-journey-pulse absolute inset-0 rounded-full bg-white/20" />
          <span className="relative flex size-24 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/30 backdrop-blur">
            <svg viewBox="0 0 24 24" className="size-12" fill="none" aria-hidden>
              <m.path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="#f4d9a6"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={lite ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
          </span>
        </div>

        <div className="relative mt-7 space-y-3" role="status" aria-live="polite">
          <m.h1
            className="font-display text-3xl font-semibold sm:text-4xl"
            initial={lite ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            {labels.title}
          </m.h1>
          {reference ? (
            <m.button
              type="button"
              onClick={copyRef}
              initial={lite ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="mx-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm ring-1 ring-white/25 transition hover:bg-white/15"
              aria-label={labels.copyReference}
            >
              <span className="text-white/70">{labels.referenceLabel}</span>
              <bdi className="font-semibold tracking-wide tabular-nums">{reference}</bdi>
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4 opacity-80" aria-hidden />}
              <span className="sr-only" aria-live="polite">
                {copied ? labels.copied : ""}
              </span>
            </m.button>
          ) : null}
          <p className="mx-auto max-w-md text-sm leading-relaxed text-white/75">{labels.handoffHint}</p>
        </div>

        {hasDeepLink ? (
          <m.div
            className="relative mt-8 space-y-3"
            initial={lite ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <p className="text-sm text-white/80">{labels.nextStep}</p>
            <button
              type="button"
              onClick={onOpenWhatsApp}
              disabled={opening}
              className="inline-flex h-14 min-w-64 items-center justify-center gap-2 rounded-full bg-[#f4d9a6] px-8 text-base font-semibold text-[#2a1340] shadow-[0_14px_40px_-12px_rgba(244,217,166,0.6)] transition hover:bg-[#ffe6b8] disabled:opacity-70"
            >
              {opening ? labels.opening : labels.openWhatsApp}
              <ExternalLink className="size-4" aria-hidden />
            </button>
          </m.div>
        ) : null}

        {error ? (
          <p className="relative mt-4 text-sm text-[#ffb4b4]" role="alert">
            {error}
          </p>
        ) : null}
      </m.div>

      <div className="rounded-[24px] border border-[var(--ro-border-control)] bg-ro-paper p-6 sm:p-8">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ro-ink">{ar ? "رحلة طلبك" : "Your request journey"}</h2>
          {orderToken ? (
            <ButtonLink href={`/order/${orderToken}`} variant="secondary" size="sm">
              {ar ? "متابعة طلبي" : "Track my request"}
            </ButtonLink>
          ) : null}
        </div>
        <OrderJourney
          locale={locale}
          input={{ status: hasDeepLink ? "ready_for_handoff" : "draft", response: null }}
        />
      </div>

      <p className="text-center text-xs leading-relaxed text-ro-muted">{labels.shippingNote}</p>

      <div className="text-center">
        <ButtonLink href={href("/catalog", locale)} variant="text" size="sm">
          {labels.catalog}
        </ButtonLink>
      </div>
    </section>
  );
}
