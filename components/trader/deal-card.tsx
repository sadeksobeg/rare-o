"use client";

import Link from "next/link";
import { ChevronRight, Handshake } from "lucide-react";
import { PressRipple } from "@/components/motion/press-ripple";
import { Pill } from "@/components/ui-kit/pill";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/ui/status";

/** Interactive record card — press + hover lift. */
export function DealCard({
  href,
  reference,
  title,
  meta,
  tone,
  statusLabel,
  waitingLabel,
  className,
}: {
  href: string;
  reference: string;
  title?: string;
  meta?: string;
  tone: StatusTone;
  statusLabel: string;
  waitingLabel?: string | null;
  className?: string;
}) {
  return (
    <PressRipple>
    <Link
      href={href}
      className={cn(
        "rad-card group flex min-h-20 items-center gap-3 px-4 py-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
        waitingLabel &&
          "border-[color-mix(in_srgb,var(--rad-ac)_40%,var(--rad-bd))]",
        className
      )}
    >
      <span className="relative ro-portal-icon-well size-10 transition-transform duration-[var(--ro-dur-fast)] group-hover:scale-105 [&>svg]:size-4">
        {waitingLabel ? (
          <span
            aria-hidden
            className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full bg-[color:var(--rad-ac)] motion-safe:animate-pulse"
          />
        ) : null}
        <Handshake className="size-4" strokeWidth={1.5} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="block text-xs font-bold tracking-wide text-[color:var(--rad-tx3)]">
          {reference}
        </span>
        {title ? (
          <span className="block text-base font-semibold leading-snug text-[color:var(--rad-tx)] transition-colors group-hover:text-[color:var(--rad-ac)]">
            {title}
          </span>
        ) : null}
        <span className="flex flex-wrap items-center gap-2">
          <Pill tone={statusToneToPill(tone)}>{statusLabel}</Pill>
          {waitingLabel ? <Pill tone="warn">{waitingLabel}</Pill> : null}
          {meta ? (
            <span className="text-xs font-semibold text-[color:var(--rad-tx3)]">
              {meta}
            </span>
          ) : null}
        </span>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-[color:var(--rad-ac)] transition-transform duration-[var(--ro-dur-fast)] group-hover:translate-x-1 group-active:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-1"
        aria-hidden
      />
    </Link>
    </PressRipple>
  );
}
