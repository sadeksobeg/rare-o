"use client";

import { m } from "motion/react";
import { useMotion } from "@/components/motion/provider";
import {
  computeJourney,
  type JourneyInput,
  type JourneyStep,
} from "@/lib/retail-request/journey";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const COPY: Record<JourneyStep["key"], { ar: [string, string]; en: [string, string] }> = {
  received: {
    ar: ["وصل طلبك", "سجّلنا طلبك ومرجعه محفوظ لديك"],
    en: ["Request received", "Your request and its reference are saved"],
  },
  whatsapp: {
    ar: ["التواصل عبر واتساب", "أرسل الرسالة المعدّة ليبدأ فريقنا معك"],
    en: ["Chat on WhatsApp", "Send the prepared message so our team can start"],
  },
  confirm: {
    ar: ["تأكيد بياناتك", "راجع اسمك وهاتفك ووجهتك وأكّدها"],
    en: ["Confirm your details", "Review your name, phone and destination"],
  },
  prepare: {
    ar: ["التجهيز", "نجهّز قطعتك ونغلّفها بعناية"],
    en: ["Preparation", "We prepare and pack your piece with care"],
  },
  ship: {
    ar: ["في الطريق إليك", "سلّمنا الشحنة للناقل"],
    en: ["On its way", "Handed over to the carrier"],
  },
  deliver: {
    ar: ["التسليم", "وصلت قطعتك — نتمنى أن تسعدك"],
    en: ["Delivered", "Your piece has arrived — enjoy it"],
  },
};

function Check({ delay, lite }: { delay: number; lite: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <m.path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={lite ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/**
 * The whole journey of the request, animated: the rail fills up to the current
 * step, finished steps draw their check one after another, the current step
 * pulses. Motion collapses to a static layout for reduced-motion / lite tier.
 */
export type JourneyUpdate = { status: string; title: string; note: string; at: string };

export function OrderJourney({
  locale,
  input,
  className,
  etaLabel,
  updates = [],
}: {
  locale: Locale;
  input: JourneyInput;
  className?: string;
  /** e.g. «7–10 أيام» — shown while the shipment is still on its way. */
  etaLabel?: string | null;
  /** Team posts about the shipment, newest first. */
  updates?: JourneyUpdate[];
}) {
  const { lite } = useMotion();
  const ar = locale === "ar";
  const { steps, cancelled, activeIndex } = computeJourney(input);
  const doneCount = steps.filter((s) => s.state === "done").length;
  const progress = cancelled ? 0 : Math.min(1, (doneCount + (activeIndex >= 0 ? 0.5 : 0)) / steps.length);

  return (
    <ol
      aria-label={ar ? "مراحل طلبك" : "Your request journey"}
      className={cn("relative space-y-1", className)}
    >
      {/* rail */}
      <span
        aria-hidden
        className="absolute inset-y-6 start-[19px] w-[2px] rounded-full bg-[color-mix(in_srgb,var(--ro-plum-900)_14%,transparent)]"
      />
      <m.span
        aria-hidden
        className="absolute start-[19px] top-6 w-[2px] origin-top rounded-full bg-gradient-to-b from-[var(--ro-plum-700)] to-[var(--ro-amber-500,#c8963e)]"
        style={{ height: "calc(100% - 3rem)" }}
        initial={lite ? false : { scaleY: 0 }}
        animate={{ scaleY: progress }}
        transition={{ duration: 1.1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      />

      {steps.map((step, i) => {
        const [title, hint] = COPY[step.key][ar ? "ar" : "en"];
        const alertHint = ar ? "طلبتَ تعديلاً — نحدّث بياناتك الآن" : "You asked for a change — we are updating your details";
        const latest = updates[0];
        const showLatest =
          !!latest &&
          ((step.key === "ship" && step.state !== "pending" && input.shipmentStatus !== "ARRIVED" && input.shipmentStatus !== "DELIVERED") ||
            (step.key === "deliver" && (input.shipmentStatus === "ARRIVED" || input.shipmentStatus === "DELIVERED")));
        const showEta = !!etaLabel && step.key === "ship" && step.state !== "done" && !["ARRIVED", "DELIVERED"].includes(input.shipmentStatus ?? "");
        return (
          <m.li
            key={step.key}
            className="relative flex items-start gap-4 py-3"
            initial={lite ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
            aria-current={step.state === "active" || step.state === "alert" ? "step" : undefined}
          >
            <span className="relative z-10 flex size-10 shrink-0 items-center justify-center">
              {step.state === "active" || step.state === "alert" ? (
                <span
                  aria-hidden
                  className={cn(
                    "ro-journey-pulse absolute inset-0 rounded-full",
                    step.state === "alert" ? "bg-[var(--ro-amber-500,#c8963e)]/30" : "bg-[var(--ro-plum-700)]/25"
                  )}
                />
              ) : null}
              <span
                className={cn(
                  "relative flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  step.state === "done" &&
                    "border-transparent bg-gradient-to-br from-[var(--ro-plum-700)] to-[var(--ro-plum-900)] text-white shadow-[0_6px_18px_-6px_rgba(82,39,124,0.55)]",
                  step.state === "active" && "border-[var(--ro-plum-700)] bg-ro-paper text-[var(--ro-plum-900)]",
                  step.state === "alert" && "border-[var(--ro-amber-500,#c8963e)] bg-ro-paper text-[var(--ro-amber-600,#a87a2c)]",
                  step.state === "pending" && "border-[var(--ro-border-control)] bg-ro-paper text-ro-muted"
                )}
              >
                {step.state === "done" ? (
                  <Check delay={0.35 + i * 0.16} lite={lite} />
                ) : step.state === "alert" ? (
                  "!"
                ) : (
                  <span className="tabular-nums">{i + 1}</span>
                )}
              </span>
            </span>
            <div className="min-w-0 pt-1.5">
              <p
                className={cn(
                  "text-[15px] font-semibold",
                  step.state === "pending" ? "text-ro-muted" : "text-ro-ink"
                )}
              >
                {title}
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ro-muted">
                {step.state === "alert" ? alertHint : hint}
              </p>
              {showEta ? (
                <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--ro-amber-500,#c8963e)_16%,transparent)] px-3 py-1 text-xs font-semibold text-[var(--ro-amber-600,#8a5f12)]">
                  <span aria-hidden>⏱</span>
                  {ar ? `الوصول المتوقع: ${etaLabel}` : `Expected delivery: ${etaLabel}`}
                </p>
              ) : null}
              {showLatest && latest ? (
                <m.div
                  initial={lite ? false : { opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.09, duration: 0.5 }}
                  className="mt-2 rounded-xl border border-[color-mix(in_srgb,var(--ro-plum-700)_30%,transparent)] bg-[color-mix(in_srgb,var(--ro-plum-900)_6%,transparent)] px-3.5 py-2.5 text-[13px]"
                >
                  <p className="font-semibold text-ro-ink">{latest.title}</p>
                  {latest.note ? <p className="mt-0.5 text-ro-text-2">{latest.note}</p> : null}
                  <p className="mt-1 text-[11px] text-ro-muted" dir="ltr">
                    {new Date(latest.at).toLocaleString(ar ? "ar-u-nu-latn" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </m.div>
              ) : null}
            </div>
          </m.li>
        );
      })}
      {cancelled ? (
        <li className="ps-14 text-sm text-ro-muted">
          {ar ? "أُلغي هذا الطلب — تواصل معنا إن كان غير مقصود." : "This request was cancelled — contact us if unexpected."}
        </li>
      ) : null}
    </ol>
  );
}
