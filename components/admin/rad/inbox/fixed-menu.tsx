"use client";

import {
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type FixedMenuPlacement = "below-end" | "above-start";

/**
 * Portals a menu to document.body with position:fixed so inbox
 * overflow:hidden ancestors cannot clip it (⋯ header + attach composer).
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
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

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

      if (placement === "below-end") {
        const top = Math.min(r.bottom + 6, vh - pad);
        // Prefer aligning to the inline-end edge of the trigger (RTL-aware via right).
        const right = Math.max(pad, vw - r.right);
        setStyle({
          position: "fixed",
          top,
          right,
          left: "auto",
          bottom: "auto",
          maxHeight: Math.max(160, vh - top - pad),
          overflowY: "auto",
        });
        return;
      }

      // above-start — attach / emoji near composer
      const bottom = Math.max(pad, vh - r.top + 6);
      const left = Math.min(Math.max(pad, r.left), vw - 240);
      setStyle({
        position: "fixed",
        bottom,
        left,
        top: "auto",
        right: "auto",
        maxHeight: Math.max(120, r.top - pad * 2),
        overflowY: "auto",
      });
    }

    place();
    window.addEventListener("resize", place);
    // Capture scroll from inbox columns without missing nested scrollers.
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef, placement]);

  if (!open || !mounted || !style) return null;

  return createPortal(
    <div
      className={cn("rad-fixed-menu rad-on", className)}
      role={role}
      style={style}
    >
      {children}
    </div>,
    document.body
  );
}
