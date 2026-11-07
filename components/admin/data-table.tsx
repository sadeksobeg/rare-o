"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { type MouseEvent, type ReactNode } from "react";
import { spawnPressRipple } from "@/components/motion/press-ripple";
import { cn } from "@/lib/utils";

const ROW_NAV_IGNORE =
  "a, button, input, select, textarea, label, [data-no-row-nav]";

/** Thin presentational table primitives — interactive row affordance. */
export function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="ro-portal-table overflow-x-auto rounded-[14px]">
      <table className="min-w-full text-start text-[0.9375rem] font-medium">
        {children}
      </table>
    </div>
  );
}

export function DataTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-[color:var(--ro-border-subtle)]">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "p-3.5 text-start text-[11px] font-semibold uppercase tracking-wide text-[color:var(--ro-text-muted)]",
        className
      )}
    >
      {children}
    </th>
  );
}

/**
 * Server-driven sortable column header: a link that toggles sort direction
 * in the URL (sort state lives in searchParams, not client state — matches
 * the project's existing filter/tab pattern). The page supplies `href` for
 * the next click (asc if inactive/desc, desc if currently asc) and tells us
 * the active field/direction so we can render the right indicator.
 */
export function SortableTh({
  children,
  href,
  active,
  direction,
  className,
}: {
  children: ReactNode;
  href: string;
  active: boolean;
  direction?: "asc" | "desc";
  className?: string;
}) {
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      className={cn(
        "p-0 text-start text-[11px] font-semibold uppercase tracking-wide text-[color:var(--ro-text-muted)]",
        className
      )}
    >
      <Link
        href={href}
        className={cn(
          "flex w-full items-center gap-1 p-3.5 text-start no-underline hover:text-[color:var(--ro-text)]",
          active && "text-[color:var(--ro-text)]"
        )}
        aria-current={active ? "true" : undefined}
      >
        {children}
        <Icon className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
      </Link>
    </th>
  );
}

export function Tr({
  children,
  className,
  flash,
  href,
}: {
  children: ReactNode;
  className?: string;
  flash?: boolean;
  /** Whole-row open target (except nested links/buttons). */
  href?: string;
}) {
  const router = useRouter();

  function onRowClick(e: MouseEvent<HTMLTableRowElement>) {
    if (!href) return;
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest(ROW_NAV_IGNORE)) return;
    router.push(href);
  }

  return (
    <tr
      data-href={href || undefined}
      className={cn(
        "ro-portal-interactive-row border-b border-[color:var(--ro-border-subtle)] last:border-b-0 hover:bg-[color:color-mix(in_srgb,var(--ro-panel-hover)_65%,transparent)]",
        flash && "ro-s10-flash",
        className
      )}
      onClick={href ? onRowClick : undefined}
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
  children?: ReactNode;
  className?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <td
      dir={dir}
      className={cn(
        "px-3.5 py-3.5 align-middle text-[color:var(--ro-text)]",
        className
      )}
    >
      {children}
    </td>
  );
}

/**
 * Full-cell link — fills the Td padding box so the row feels clickable
 * even when JS row handlers are stale/cached in the browser.
 */
export function CellLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "-mx-3.5 -my-3.5 block px-3.5 py-3.5 text-inherit no-underline",
        className
      )}
    >
      {children}
    </Link>
  );
}

/** Primary name link inside an interactive row (full cell). */
export function RowHit({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <CellLink
      href={href}
      className="ro-row-hit ro-press-ripple font-semibold text-[color:var(--ro-text)]"
    >
      <span
        className="ro-press-ripple"
        onPointerDown={(e) => {
          spawnPressRipple(e.currentTarget, e.clientX, e.clientY);
        }}
      >
        {children}
      </span>
    </CellLink>
  );
}
