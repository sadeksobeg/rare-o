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
  children,
  className,
  size = "sm",
  preventDismiss = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: DialogSize;
  /** Block Esc / backdrop close (e.g. show-once password). */
  preventDismiss?: boolean;
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
        "ro-dialog m-0 max-h-[min(90vh,100%)] border border-ro-line bg-ro-paper p-0 text-ro-ink shadow-none backdrop:bg-[color-mix(in_srgb,var(--ro-ink-950)_55%,transparent)] open:flex open:flex-col",
        "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:w-full max-md:max-w-none max-md:rounded-t-[var(--ro-r-lg)] max-md:rounded-b-none",
        "md:fixed md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[var(--ro-r-sm)]",
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
      <div className="space-y-4 overflow-auto p-5">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        {children}
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
      <p className="text-sm text-ro-muted">{body}</p>
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
