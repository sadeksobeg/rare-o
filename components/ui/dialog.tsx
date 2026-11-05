"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type DialogSize = "sm" | "md" | "lg";

const sizeClass: Record<DialogSize, string> = {
  sm: "w-[min(440px,calc(100%-2rem))]",
  md: "w-[min(560px,calc(100%-2rem))]",
  lg: "w-[min(720px,calc(100%-2rem))]",
};

/** P08 — native `<dialog>` + Sheet below 640 px; Esc closes; focus returns. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = "sm",
  preventDismiss = false,
  hideHeader = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: DialogSize;
  /** Block Esc / backdrop close (e.g. show-once password). */
  preventDismiss?: boolean;
  /** Caller renders its own title block. */
  hideHeader?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      previouslyFocused.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      el.showModal();
      document.documentElement.classList.add("ro-scroll-lock");
    }
    if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onNativeClose() {
      document.documentElement.classList.remove("ro-scroll-lock");
      previouslyFocused.current?.focus?.();
      previouslyFocused.current = null;
    }
    el.addEventListener("close", onNativeClose);
    return () => {
      el.removeEventListener("close", onNativeClose);
      document.documentElement.classList.remove("ro-scroll-lock");
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={cn(
        "ro-dialog m-0 max-h-[min(90vh,100%)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)] p-0 text-[color:var(--ro-text)] shadow-[var(--ro-e3)] backdrop:bg-[color-mix(in_srgb,var(--ro-ink-950)_60%,transparent)] open:flex open:flex-col",
        "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:w-full max-md:max-w-none max-md:rounded-t-[var(--ro-r-lg)] max-md:rounded-b-none",
        "md:fixed md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[14px]",
        sizeClass[size],
        "max-md:!w-full",
        className
      )}
      onClose={onClose}
      onCancel={(e) => {
        if (preventDismiss) e.preventDefault();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          if (preventDismiss) return;
          onClose();
        }
      }}
    >
      <div className="flex max-h-[inherit] flex-col overflow-hidden">
        {!hideHeader ? (
          <div className="shrink-0 border-b border-[color:var(--ro-border-subtle)] px-5 pb-3 pt-5">
            <h2
              id={titleId}
              className="font-display text-lg font-semibold text-[color:var(--ro-text)]"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--ro-text-muted)]">
                {description}
              </p>
            ) : null}
          </div>
        ) : (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        )}
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">{children}</div>
      </div>
    </dialog>
  );
}

/** Sheet alias — same Dialog; mobile layout is automatic below 640. */
export const Sheet = Dialog;

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  cancelLabel,
  pending,
  destructive = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  pending?: boolean;
  destructive?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-[color:var(--ro-text-muted)]">{body}</p>
      {/* Destructive: cancel start-side, danger end-side (logical). */}
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={destructive ? "danger" : "primary"}
          size="sm"
          loading={pending}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
