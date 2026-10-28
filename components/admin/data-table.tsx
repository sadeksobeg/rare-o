"use client";

import Link from "next/link";
import { spawnPressRipple } from "@/components/motion/press-ripple";
import { cn } from "@/lib/utils";

/** Thin presentational table primitives — interactive row affordance. */
export function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="ro-portal-table overflow-x-auto border">
      <table className="min-w-full text-start text-[0.9375rem] font-medium">
        {children}
      </table>
    </div>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-ro-line">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "p-3.5 text-start text-xs font-bold tracking-wide text-ro-text-2",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Tr({
  children,
  className,
  flash,
}: {
  children: React.ReactNode;
  className?: string;
  flash?: boolean;
}) {
  return (
    <tr
      className={cn(
        "ro-portal-interactive-row border-b border-ro-line last:border-b-0 hover:bg-[color-mix(in_srgb,var(--ro-plum-50)_55%,var(--ro-sand-200))]",
        flash && "ro-s10-flash",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  className,
  dir,
}: {
  children?: React.ReactNode;
  className?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <td dir={dir} className={cn("p-3 align-middle", className)}>
      {children}
    </td>
  );
}

/** Stretched hit-target so the whole row opens the record. */
export function RowHit({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="ro-row-hit ro-press-ripple font-medium text-ro-ink"
      onPointerDown={(e) => {
        spawnPressRipple(e.currentTarget, e.clientX, e.clientY);
      }}
    >
      {children}
    </Link>
  );
}
