"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Compass, Handshake, Package } from "lucide-react";
import { PressRipple } from "@/components/motion/press-ripple";
import { cn } from "@/lib/utils";

const TASK_ICONS = {
  handshake: Handshake,
  package: Package,
  compass: Compass,
} as const;

/** Compact ~72px start-here rows (mobile + desktop) — small thumbs, not hero tiles. */
export function TaskCard({
  href,
  title,
  body,
  icon,
  imageSrc,
  className,
}: {
  href: string;
  title: string;
  body: string;
  icon: keyof typeof TASK_ICONS;
  /** Optional brand/product thumb for the row. */
  imageSrc?: string;
  className?: string;
}) {
  const Icon = TASK_ICONS[icon];

  return (
    <PressRipple>
      <Link
        href={href}
        className={cn(
          "rad-card group flex h-[72px] items-center gap-3 overflow-hidden px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
          className
        )}
      >
        {imageSrc ? (
          <span className="relative size-12 shrink-0 overflow-hidden rounded-[var(--rad-r-sm,10px)] bg-[color:var(--rad-surface3)]">
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          </span>
        ) : (
          <span className="ro-portal-icon-well size-12 shrink-0 transition-transform duration-[var(--ro-dur-fast)] group-hover:scale-105 group-active:scale-100 [&>svg]:size-5">
            <Icon className="size-5" strokeWidth={1.5} aria-hidden />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-snug text-[color:var(--rad-tx)] transition-colors group-hover:text-[color:var(--rad-ac)]">
            {title}
          </span>
          <span className="mt-0.5 block truncate text-xs text-[color:var(--rad-tx3)]">
            {body}
          </span>
        </span>
        <ChevronRight
          className="size-5 shrink-0 text-[color:var(--rad-ac)] transition-transform duration-[var(--ro-dur-fast)] group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
          aria-hidden
        />
      </Link>
    </PressRipple>
  );
}
