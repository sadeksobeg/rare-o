"use client";

import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Boxes, ChevronDown, Compass, Percent, Plus, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickCreateItem } from "@/components/admin/quick-create";

const ICONS = {
  product: Boxes,
  offer: Percent,
  trader: Store,
  brokerage: Compass,
} as const;

/**
 * Header create action — replaces the dashboard's floating "+" button
 * (owner brief 2026-11-08 §5a: create action lives in the header + command
 * palette, never a FAB over content).
 */
export function HeaderQuickCreate({
  label,
  items,
}: {
  label: string;
  items: QuickCreateItem[];
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-[var(--ro-r-sm)] px-3 text-sm font-semibold transition-[background-color,transform] duration-[var(--ro-dur-fast)] active:scale-[0.97]",
            "bg-[var(--pilot-accent,var(--pilot-plum-700,var(--ro-plum-700)))] text-[var(--pilot-bg,var(--pilot-cream-50,var(--ro-sand-50)))] hover:opacity-95",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pilot-focus,var(--pilot-focus,var(--ro-focus)))]"
          )}
          aria-label={label}
        >
          <Plus className="size-4" strokeWidth={1.5} aria-hidden />
          <span className="hidden sm:inline">{label}</span>
          <ChevronDown className="size-3.5 opacity-70" strokeWidth={1.5} aria-hidden />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-[95] min-w-[13rem] overflow-hidden rounded-[var(--ro-r-lg)] border p-1",
            "border-[color:var(--pilot-border,var(--pilot-border-subtle,var(--ro-border-subtle)))] bg-[color:var(--pilot-bg-elevated,var(--pilot-bg-raised,var(--ro-bg-raised)))]",
            "shadow-[var(--pilot-shadow-pop,var(--shadow-3))]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          )}
        >
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <DropdownMenu.Item key={item.href} asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-10 items-center gap-2.5 rounded-[var(--ro-r-sm)] px-2.5 text-sm font-medium outline-none transition-colors",
                    "text-[color:var(--pilot-text,var(--pilot-text,var(--ro-text)))]",
                    "data-[highlighted]:bg-[color:var(--pilot-accent-bg,color-mix(in_srgb,var(--pilot-plum-700,var(--ro-plum-700))_14%,transparent))]"
                  )}
                >
                  <Icon
                    className="size-4 shrink-0 text-[color:var(--pilot-accent,var(--pilot-plum-400,var(--ro-plum-400)))]"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  {item.label}
                </Link>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
