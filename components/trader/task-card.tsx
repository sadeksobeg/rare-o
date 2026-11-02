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
  /** Optional brand/product photo for lab-style hero task cards. */
  imageSrc?: string;
  className?: string;
}) {
  const Icon = TASK_ICONS[icon];

  if (imageSrc) {
    return (
      <PressRipple>
        <Link
          href={href}
          className={cn(
            "group relative flex min-h-52 flex-col justify-end overflow-hidden rounded-[var(--ro-r-lg)] text-[var(--ro-sand-50)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
            className
          )}
        >
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-[var(--ro-dur-slow)] ease-[var(--ro-ease-standard)] group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-[var(--ro-ink-950)] via-[color-mix(in_srgb,var(--ro-plum-900)_55%,transparent)] to-transparent"
          />
          <span className="relative z-10 space-y-2 p-5">
            <span className="inline-flex size-10 items-center justify-center rounded-[var(--ro-r-sm)] bg-[color-mix(in_srgb,var(--ro-sand-50)_16%,transparent)]">
              <Icon className="size-5" strokeWidth={1.5} aria-hidden />
            </span>
            <span className="font-display block text-xl font-bold leading-snug">
              {title}
            </span>
            <span className="block text-sm text-[color-mix(in_srgb,var(--ro-sand-100)_82%,transparent)]">
              {body}
            </span>
          </span>
        </Link>
      </PressRipple>
    );
  }

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
