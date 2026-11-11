"use client";

import {
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";
import {
  InboxOverlayPortal,
  INBOX_OVERLAY_Z,
} from "@/components/admin/rad/inbox/overlay-root";

export type FixedMenuPlacement = "below-end" | "above-start";

const MENU_MIN_W = 220;

/**
 * Viewport-fixed menu via OverlayRoot — flip/shift to stay inside the window.
 * `variant="panel"` skips `.rad-menu` (which forces display:block + full-width
 * buttons — that turned the emoji grid into a tall 1-column strip).
 */
export function FixedMenu({
  open,
  anchorRef,
  placement,
  className,
  role = "menu",
  variant = "menu",
  width,
  maxHeight,
  children,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  placement: FixedMenuPlacement;
  className?: string;
  role?: string;
  variant?: "menu" | "panel";
  /** Fixed width in px (default 220 for menus). */
  width?: number;
  /** Cap height; panels should pass a compact value (e.g. 280). */
  maxHeight?: number;
  children: ReactNode;
}) {
  const [style, setStyle] = useState<CSSProperties | null>(null);
  const w = width ?? MENU_MIN_W;

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }

    function place() {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const pad = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const preferBelow = placement === "below-end";
      const spaceBelow = vh - r.bottom - pad;
      const spaceAbove = r.top - pad;
      const openBelow =
        preferBelow
          ? spaceBelow >= 120 || spaceBelow >= spaceAbove
          : spaceAbove < 120 && spaceBelow > spaceAbove;

      const cap =
        maxHeight != null
          ? maxHeight
          : Math.min(420, Math.max(120, preferBelow ? spaceBelow : spaceAbove));

      if (openBelow) {
        const top = Math.min(r.bottom + 6, vh - pad);
        let left = r.right - w;
        left = Math.min(Math.max(pad, left), vw - w - pad);
        setStyle({
          position: "fixed",
          top,
          left,
          right: "auto",
          bottom: "auto",
          width: w,
          maxHeight: Math.min(cap, Math.max(80, vh - top - pad)),
          overflowY: "auto",
        });
        return;
      }

      // If the anchor lives in the composer, clear the whole .rad-cmp
      // (not just the button) so the panel does not cover the textarea.
      const clearEl =
        (el.closest(".rad-cmp") as HTMLElement | null) ||
        (el.closest(".rad-cbr") as HTMLElement | null);
      const clearTop = clearEl ? clearEl.getBoundingClientRect().top : r.top;
      const bottom = Math.max(pad, vh - clearTop + 6);
      // Prefer aligning to the button’s inline-start; keep fully on-screen
      let left = r.right - w;
      left = Math.min(Math.max(pad, left), vw - w - pad);
      setStyle({
        position: "fixed",
        bottom,
        left,
        top: "auto",
        right: "auto",
        width: w,
        maxHeight: Math.min(cap, Math.max(80, clearTop - pad * 2)),
        overflowY: "auto",
      });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef, placement, w, maxHeight]);

  if (!open || !style) return null;

  return (
    <InboxOverlayPortal z={INBOX_OVERLAY_Z.menu}>
      <div
        className={cn(
          "rad-fixed-menu rad-on",
          variant === "menu" && "rad-menu",
          className
        )}
        role={role}
        style={{
          ...style,
          opacity: 1,
          background: "var(--rad-surface)",
          border: "1px solid var(--rad-bd2)",
          color: "var(--rad-tx)",
          /* Shadow from CSS (light theme uses a softer one — avoid inline override) */
        }}
        data-inbox-overlay-item="menu"
      >
        {children}
      </div>
    </InboxOverlayPortal>
  );
}
