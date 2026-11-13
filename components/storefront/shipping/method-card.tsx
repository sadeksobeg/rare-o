"use client";

import { AnimatePresence, m } from "motion/react";
import { Check, Info, Truck } from "lucide-react";
import { useMotion } from "@/components/motion/provider";
import {
  badgeLabel,
  modeLabel,
  securityLabel,
  speedLabel,
  type MethodBadge,
  type QuoteMethodUi,
} from "@/lib/shipping/quote-ui";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const t = (locale: Locale, ar: string, en: string) =>
  locale === "ar" ? ar : en;

export function MethodCard({
  locale,
  opt,
  active,
  badges,
  index,
  onlyOne,
  onSelect,
}: {
  locale: Locale;
  opt: QuoteMethodUi;
  active: boolean;
  badges: MethodBadge[];
  index: number;
  onlyOne: boolean;
  onSelect: () => void;
}) {
  const { lite } = useMotion();
  return (
    <m.button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={t(locale, opt.labelAr, opt.labelEn)}
      onClick={onSelect}
      initial={lite ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: lite ? 0 : 0.22,
        delay: lite ? 0 : index * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileTap={lite ? undefined : { scale: 0.98 }}
      className={cn(
        "flex items-start gap-2.5 rounded-[var(--ro-r-sm)] border px-3.5 py-3 text-start transition-colors duration-[var(--ro-dur-fast)]",
        active
          ? "border-[var(--ro-plum-900)] bg-[color-mix(in_srgb,var(--ro-plum-900)_6%,transparent)]"
          : "border-[var(--ro-border-control)] hover:bg-ro-sunken"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[var(--ro-r-full)] border",
          active
            ? "border-[var(--ro-plum-900)] bg-[var(--ro-plum-900)] text-ro-canvas"
            : "border-[var(--ro-border-control)] text-transparent"
        )}
        aria-hidden
      >
        <AnimatePresence initial={false} mode="wait">
          {active ? (
            <m.span
              key="on"
              initial={lite ? false : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={lite ? undefined : { scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className="flex items-center justify-center"
            >
              <Check className="size-3" strokeWidth={2} />
            </m.span>
          ) : null}
        </AnimatePresence>
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-ro-ink">
          <Truck
            className="size-3.5 shrink-0 text-ro-muted"
            strokeWidth={1.5}
            aria-hidden
          />
          {t(locale, opt.labelAr, opt.labelEn)}
        </span>
        {onlyOne ? (
          <span className="block text-[11px] text-ro-muted">
            {t(locale, "الطريقة الوحيدة المتاحة", "Only available method")}
          </span>
        ) : null}
        {badges.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {badges.map((b) => (
              <span
                key={b}
                className="inline-flex rounded-[var(--ro-r-full)] bg-[color-mix(in_srgb,var(--ro-plum-900)_12%,transparent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ro-plum-900)]"
              >
                {badgeLabel(b, locale)}
              </span>
            ))}
          </span>
        ) : null}
        <span className="relative block h-[1.375rem] overflow-hidden text-base font-semibold tabular-nums text-ro-ink">
          <bdi dir="ltr">
            {opt.amount} {opt.currency}
          </bdi>
        </span>
        {opt.alternate ? (
          <span className="block text-[11px] text-ro-muted">
            {t(locale, "عند التسديد هناك", "or paid there")}{" "}
            <bdi dir="ltr">
              {opt.alternate.amount} {opt.alternate.currency}
            </bdi>
          </span>
        ) : null}
        {opt.consolidation ? (
          <span className="group/consol relative inline-flex items-center gap-1 text-[11px] text-ro-muted">
            <Info className="size-3 shrink-0" strokeWidth={1.5} aria-hidden />
            <span className="underline decoration-dotted underline-offset-2">
              {t(locale, "تجميع شحنات", "Consolidation")}
            </span>
            <span
              data-testid="ro-consolidation-tooltip"
              className="pointer-events-none absolute start-0 bottom-[calc(100%+6px)] z-20 hidden w-56 rounded-md border border-[var(--ro-border-control)] bg-ro-paper px-2.5 py-2 text-start text-[11px] leading-snug text-ro-ink shadow-md group-hover/consol:block"
            >
              {t(
                locale,
                "يُجمَّع الشحن مع طرود أخرى قبل الخروج من سورية — قد يزيد زمن التسليم قليلاً.",
                "Shipment may consolidate with others before leaving Syria — delivery can take a little longer."
              )}
            </span>
          </span>
        ) : null}
        {opt.mode || opt.speed || opt.security ? (
          <span className="block text-[11px] text-ro-muted">
            {[
              modeLabel(opt.mode, locale),
              speedLabel(opt.speed, locale),
              securityLabel(opt.security, locale),
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        ) : null}
      </span>
    </m.button>
  );
}
