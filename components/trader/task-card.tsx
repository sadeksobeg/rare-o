"use client";

import Link from "next/link";
import { Compass, Handshake, Package } from "lucide-react";
import { PressRipple } from "@/components/motion/press-ripple";
import { cn } from "@/lib/utils";

const TASK_ICONS = {
  handshake: Handshake,
  package: Package,
  compass: Compass,
} as const;

const TASK_TONES = {
  handshake: "rad-c-ac",
  package: "rad-c-info",
  compass: "rad-c-warn",
} as const;

/** Start-here decision card — larger surface matching trader-home.html `.start`. */
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
  icon: keyof typeof TASK_ICONS;
  /** @deprecated thumbs removed — icon chip matches ui-kit start cards */
  imageSrc?: string;
  className?: string;
}) {
  const Icon = TASK_ICONS[icon];
  const tone = TASK_TONES[icon];

  return (
    <PressRipple>
      <Link
        href={href}
        className={cn(
          "rad-card rad-tstart focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--rad-ac)]",
          className
        )}
      >
        <span className={cn("rad-chip rad-chip-lg", tone)}>
          <Icon width={22} height={22} strokeWidth={1.5} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <b>{title}</b>
          <p>{body}</p>
        </span>
      </Link>
    </PressRipple>
  );
}
