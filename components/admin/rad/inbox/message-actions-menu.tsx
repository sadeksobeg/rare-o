"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Ellipsis, EyeOff, Reply } from "lucide-react";
import { FixedMenu } from "@/components/admin/rad/inbox/fixed-menu";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Message actions via OverlayRoot FixedMenu — never absolute inside the bubble
 * (which lives under overflow:auto and gets clipped).
 */
export function MessageActionsMenu({
  ib,
  onReply,
  onCopy,
  onHide,
}: {
  ib: Dictionary["ib"];
  onReply: () => void;
  onCopy: () => void | Promise<void>;
  onHide: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const longPressTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (t instanceof Element && t.closest(".rad-fixed-menu, .rad-msg-menu")) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function clearLongPress() {
    if (longPressTimer.current != null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  return (
    <div className="rad-msg-acts">
      <button
        ref={btnRef}
        type="button"
        className="rad-ib rad-msg-acts-trig"
        aria-label={ib.moreActions}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        onTouchStart={() => {
          clearLongPress();
          longPressTimer.current = window.setTimeout(() => setOpen(true), 480);
        }}
        onTouchEnd={clearLongPress}
        onTouchMove={clearLongPress}
        onTouchCancel={clearLongPress}
      >
        <Ellipsis width={14} height={14} strokeWidth={1.5} aria-hidden />
      </button>
      <FixedMenu
        open={open}
        anchorRef={btnRef}
        placement="below-end"
        className="rad-menu rad-msg-menu"
      >
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onReply();
          }}
        >
          <Reply width={14} height={14} strokeWidth={1.5} aria-hidden />
          {ib.replyToMessage}
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setOpen(false);
            void onCopy();
          }}
        >
          <Copy width={14} height={14} strokeWidth={1.5} aria-hidden />
          {ib.copyMessage}
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onHide();
          }}
        >
          <EyeOff width={14} height={14} strokeWidth={1.5} aria-hidden />
          {ib.hideForMe}
        </button>
      </FixedMenu>
    </div>
  );
}
