"use client";

import Link from "next/link";
import { ChevronRight, Compass, Handshake, Package } from "lucide-react";
import { PressRipple } from "@/components/motion/press-ripple";
import { cn } from "@/lib/utils";

const TASK_ICONS = {
  handshake: Handshake,
  package: Package,
  compass: Compass,
} as const;

export function TaskCard({
  href,
  title,
  body,
  icon,
  className,
}: {
  href: string;
  title: string;
  body: string;
  /** A lucide-react component can't cross the server-to-client boundary as a
   * prop (it isn't a registered RSC client reference) - pass a plain string
   * key instead and let this client module import/render the icon itself,
   * same pattern DealCard already uses for its own icon. */
  icon: keyof typeof TASK_ICONS;
  className?: string;
}) {
  const Icon = TASK_ICONS[icon];
  return (
    <PressRipple>
    <Link
      href={href}
      className={cn(
        "ro-portal-card group flex min-h-24 items-center gap-4 border px-5 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
        className
      )}
    >
      <span className="ro-portal-icon-well size-12 transition-transform duration-[var(--ro-dur-fast)] group-hover:scale-105 group-active:scale-100 [&>svg]:size-5">
        <Icon className="size-5" strokeWidth={1.5} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-display block text-lg font-bold leading-snug transition-colors group-hover:text-[var(--ro-plum-900)]">
          {title}
        </span>
        <span className="ro-portal-muted mt-1 block">{body}</span>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-[var(--ro-plum-800)] transition-transform duration-[var(--ro-dur-fast)] group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
        aria-hidden
      />
    </Link>
    </PressRipple>
  );
}
