"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Boxes,
  Compass,
  Percent,
  Plus,
  Store,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickCreateItem = {
  href: string;
  label: string;
  icon: "product" | "offer" | "trader" | "brokerage";
};

const ICONS = {
  product: Boxes,
  offer: Percent,
  trader: Store,
  brokerage: Compass,
} as const;

/** Floating + menu — VISION §5.2. Portaled to .ro-portal so theme tokens apply. */
export function AdminQuickCreate({
  label,
  closeLabel,
  items,
}: {
  label: string;
  closeLabel: string;
  items: QuickCreateItem[];
}) {
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState<Element | null>(null);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHost(document.querySelector(".ro-portal") ?? document.body);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  if (!host) return null;

  return createPortal(
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-end p-6 md:p-8"
    >
      <div className="pointer-events-auto flex flex-col items-end">
        {open ? (
          <ul
            id={panelId}
            role="menu"
            aria-label={label}
            className="mb-3 min-w-[12.5rem] overflow-hidden rounded-[var(--ro-r-lg)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)] text-[color:var(--ro-text)] shadow-[var(--shadow-3)]"
          >
            {items.map((item) => {
              const Icon = ICONS[item.icon];
              return (
                <li key={item.href} role="none">
                  <Link
                    role="menuitem"
                    href={item.href}
                    className="flex min-h-11 items-center gap-2.5 px-3.5 text-sm font-semibold transition-colors hover:bg-[color-mix(in_srgb,var(--ro-plum-700)_14%,transparent)]"
                    onClick={() => setOpen(false)}
                  >
                    <Icon
                      className="size-4 shrink-0 text-[var(--ro-plum-400)]"
                      strokeWidth={1.5}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
        <button
          type="button"
          className={cn(
            "inline-flex size-14 items-center justify-center rounded-full shadow-[var(--shadow-3)] transition-[transform,opacity] duration-[var(--ro-dur-fast)] active:scale-[0.97]",
            "bg-[var(--ro-plum-700)] text-[var(--ro-sand-50)] hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
          )}
          aria-label={open ? closeLabel : label}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X className="size-6" strokeWidth={1.5} aria-hidden />
          ) : (
            <Plus className="size-6" strokeWidth={1.5} aria-hidden />
          )}
        </button>
      </div>
    </div>,
    host
  );
}
