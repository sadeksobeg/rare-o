"use client";

import Link from "next/link";
import { ChevronRight, Handshake } from "lucide-react";
import { PressRipple } from "@/components/motion/press-ripple";
import { Pill } from "@/components/ui-kit/pill";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/ui/status";

/** Interactive record row — press + hover lift. */
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
    <PressRipple className="rounded-[12px]">
      <Link
        href={href}
        className={cn(
          "group flex items-center gap-3.5 rounded-[12px] px-3 py-2.5 transition-colors hover:bg-[color:var(--rad-surface2)] [outline:none] focus:[outline:none] focus-visible:[outline:2px_solid_var(--rad-ac)] focus-visible:[outline-offset:2px]",
          className
        )}
      >
        <span className="rad-ticon rad-c-warn relative">
          {waitingLabel ? (
            <span
              aria-hidden
              className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full bg-[color:var(--rad-ac)] motion-safe:animate-pulse"
            />
          ) : null}
          <Handshake className="size-4" strokeWidth={1.5} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 space-y-1">
          <span className="block truncate text-sm font-semibold leading-snug text-[color:var(--rad-tx)] transition-colors group-hover:text-[color:var(--rad-ac)]">
            {title ? `${reference} · ${title}` : reference}
          </span>
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
          className="size-5 shrink-0 text-[color:var(--rad-ac)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 rtl:rotate-180"
          aria-hidden
        />
      </Link>
    </PressRipple>
  );
}
