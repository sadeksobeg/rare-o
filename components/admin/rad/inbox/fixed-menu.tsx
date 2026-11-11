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
 */
export function FixedMenu({
  open,
  anchorRef,
  placement,
  className,
  role = "menu",
  children,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  placement: FixedMenuPlacement;
  className?: string;
  role?: string;
  children: ReactNode;
}) {
  const [style, setStyle] = useState<CSSProperties | null>(null);

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

      if (openBelow) {
        const top = Math.min(r.bottom + 6, vh - pad);
        const width = MENU_MIN_W;
        let left = r.right - width;
        left = Math.min(Math.max(pad, left), vw - width - pad);
        setStyle({
          position: "fixed",
          top,
          left,
          right: "auto",
          bottom: "auto",
          width,
          maxHeight: Math.max(120, vh - top - pad),
          overflowY: "auto",
        });
        return;
      }

      const bottom = Math.max(pad, vh - r.top + 6);
      let left = r.left;
      left = Math.min(Math.max(pad, left), vw - MENU_MIN_W - pad);
      setStyle({
        position: "fixed",
        bottom,
        left,
        top: "auto",
        right: "auto",
        width: MENU_MIN_W,
        maxHeight: Math.max(120, r.top - pad * 2),
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
  }, [open, anchorRef, placement]);

  if (!open || !style) return null;

  return (
    <InboxOverlayPortal z={INBOX_OVERLAY_Z.menu}>
      <div
        className={cn("rad-fixed-menu rad-on", className)}
        role={role}
        style={style}
        data-inbox-overlay-item="menu"
      >
        {children}
      </div>
    </InboxOverlayPortal>
  );
}
