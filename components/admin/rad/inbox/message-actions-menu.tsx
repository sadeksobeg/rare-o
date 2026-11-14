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
  const rowRef = useRef<HTMLElement | null>(null);
  const openedAt = useRef(0);
  const lastTouchEnd = useRef(0);
  const [touchMode, setTouchMode] = useState(false);

  // Touch devices: no gutter button. Long-press anywhere on the bubble opens
  // the menu (WhatsApp-style); the desktop hover button stays for mouse users.
  useEffect(() => {
    const row = btnRef.current?.closest(".rad-bb-row") as HTMLElement | null;
    rowRef.current = row;
    const mq = window.matchMedia("(hover: none)");
    setTouchMode(mq.matches);
    const onMq = () => setTouchMode(mq.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (!touchMode || !row) return;
    let startX = 0;
    let startY = 0;
    const cancel = () => {
      if (longPressTimer.current != null) {
        window.clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      cancel();
      longPressTimer.current = window.setTimeout(() => {
        longPressTimer.current = null;
        if (navigator.vibrate) navigator.vibrate(10);
        setOpen(true);
      }, 420);
    };
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (Math.abs(t.clientX - startX) > 8 || Math.abs(t.clientY - startY) > 8) cancel();
    };
    const onCtx = (e: Event) => {
      e.preventDefault();
      setOpen(true);
    };
    row.addEventListener("touchstart", onStart, { passive: true });
    row.addEventListener("touchmove", onMove, { passive: true });
    const onEnd = () => {
      lastTouchEnd.current = Date.now();
      cancel();
    };
    row.addEventListener("touchend", onEnd);
    row.addEventListener("touchcancel", cancel);
    row.addEventListener("contextmenu", onCtx);
    return () => {
      cancel();
      row.removeEventListener("touchstart", onStart);
      row.removeEventListener("touchmove", onMove);
      row.removeEventListener("touchend", onEnd);
      row.removeEventListener("touchcancel", cancel);
      row.removeEventListener("contextmenu", onCtx);
    };
  }, [touchMode]);

  useEffect(() => {
    if (!open) return;
    openedAt.current = Date.now();
    const onDoc = (e: MouseEvent) => {
      // A long-press can be followed by a synthesized mousedown on release —
      // never let it close the menu it just opened.
      if (Date.now() - openedAt.current < 400) return;
      if (Date.now() - lastTouchEnd.current < 600) return;
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
        anchorRef={touchMode && rowRef.current ? rowRef : btnRef}
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
