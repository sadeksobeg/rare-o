"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PressRipple } from "@/components/motion/press-ripple";
import { cn } from "@/lib/utils";

/** Mobile list row used under `md` next to `DataTable`. */
export function AdminRecordCard({
  href,
  title,
  meta,
  trailing,
  children,
  actionLabel,
  flash,
}: {
  href?: string;
  title: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
  actionLabel?: string;
  flash?: boolean;
}) {
  const className = cn(
    "ro-portal-card block space-y-2 border p-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
    flash && "ro-s10-flash"
  );
  const body = (
    <>
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 font-medium text-ro-ink">{title}</p>
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
        {meta ? <div className="text-sm text-ro-muted">{meta}</div> : null}
        {children}
        {actionLabel ? (
          <span className="text-sm font-medium text-ro-plum">{actionLabel}</span>
        ) : null}
    </>
  );
  return (
    <li>
      {href ? (
        <PressRipple>
          <Link href={href} className={className}>
            {body}
          </Link>
        </PressRipple>
      ) : (
        <div className={className}>{body}</div>
      )}
    </li>
  );
}

export function AdminRecordCardList({ children }: { children: ReactNode }) {
  return <ul className="space-y-2.5 md:hidden">{children}</ul>;
}
