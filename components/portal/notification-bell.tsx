"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { ChromeBadge } from "@/components/portal/chrome-badge";
import { cn } from "@/lib/utils";

export type NotificationPanelItem = {
  id: string;
  href: string;
  title: string;
  body?: string;
  unread?: boolean;
  domain?: string;
};

export function NotificationBell({
  ariaLabel,
  unread,
  items,
  viewAllHref,
  viewAllLabel,
  emptyLabel,
  tone = "default",
  chrome = false,
}: {
  ariaLabel: string;
  unread: number;
  items: NotificationPanelItem[];
  viewAllHref: string;
  viewAllLabel: string;
  emptyLabel: string;
  tone?: "default" | "on-dark";
  /** Linear-grade cluster style (header chrome). */
  chrome?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const onDark = tone === "on-dark";

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cn(
          chrome
            ? cn(
                "ro-chrome-icon relative",
                onDark && "ro-chrome-icon--on-dark"
              )
            : "ro-icon-btn relative size-11 min-h-11 px-0"
        )}
        data-tone={!chrome && onDark ? "on-dark" : undefined}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={chrome ? "ro-chrome-icon-glyph" : undefined}>
          <Bell
            className={chrome ? "size-[1.05rem]" : "size-5"}
            strokeWidth={1.5}
            aria-hidden
          />
        </span>
        <ChromeBadge
          value={unread}
          className={cn(
            "absolute flex min-w-[1.05rem] items-center justify-center rounded-full px-1 text-[0.6rem] font-bold",
            chrome ? "end-0.5 top-0.5" : "end-1 top-1 text-[0.65rem]",
            onDark
              ? "bg-[var(--ro-plum-300)] text-[var(--ro-ink-950)]"
              : "bg-[var(--ro-plum-900)] text-[var(--ro-sand-50)]"
          )}
        />
      </button>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={ariaLabel}
          className="absolute end-0 top-[calc(100%+0.4rem)] z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-[var(--ro-r-md)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-elevated)] text-[color:var(--ro-text)] shadow-[var(--shadow-2)]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[color:var(--ro-border-subtle)] px-3 py-2.5">
            <p className="text-sm font-semibold">{ariaLabel}</p>
            <Link
              href={viewAllHref}
              className="text-xs font-semibold text-[color:var(--ro-link)] underline-offset-2 hover:underline"
              onClick={() => setOpen(false)}
            >
              {viewAllLabel}
            </Link>
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[color:var(--ro-text-muted)]">
              {emptyLabel}
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block border-b border-[color:var(--ro-border-subtle)] px-3 py-2.5 transition-[background-color,opacity] duration-[var(--ro-dur-fast)] last:border-0 hover:bg-[color:var(--ro-bg-sunken)]",
                      item.unread &&
                        "bg-[color-mix(in_srgb,var(--ro-plum-900)_10%,transparent)]"
                    )}
                  >
                    <p className="text-sm font-semibold leading-snug">
                      {item.title}
                    </p>
                    {item.body ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-[color:var(--ro-text-muted)]">
                        {item.body}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
