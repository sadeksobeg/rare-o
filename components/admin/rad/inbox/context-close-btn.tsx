"use client";

import { X } from "lucide-react";
import { useInboxUi } from "@/components/admin/rad/inbox/inbox-shell";

/** Visible close control for the context drawer (Escape / scrim still work). */
export function ContextCloseButton({ label }: { label: string }) {
  const { setCtxOpen } = useInboxUi();
  return (
    <button
      type="button"
      className="rad-xp-close"
      aria-label={label}
      onClick={() => setCtxOpen(false)}
    >
      <X width={18} height={18} strokeWidth={1.5} aria-hidden />
    </button>
  );
}
