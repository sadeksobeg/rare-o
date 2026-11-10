"use client";

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Focus-trapping modal. Always portals to `document.body` so a transformed
 * ancestor (e.g. `.rad-rise`) cannot clip `position: fixed` to a card.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  actions,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
  }, []);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>(
      "textarea, input, button, [href], select, [tabindex]:not([tabindex='-1'])"
    );
    focusable?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const nodes = [
        ...panel.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        ),
      ].filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  // Body portal leaves the admin token tree — mirror portal+theme so --rad-* resolve.
  let portalAttrs: { "data-portal"?: string; "data-theme"?: string } = {};
  if (typeof document !== "undefined") {
    const host = document.querySelector<HTMLElement>(".ro-portal[data-portal]");
    if (host) {
      portalAttrs = {
        "data-portal": host.getAttribute("data-portal") || undefined,
        "data-theme": host.getAttribute("data-theme") || undefined,
      };
    }
  }

  const node = (
    <div
      className={cn("rad-mo rad-on", portalAttrs["data-portal"] ? "ro-portal" : null)}
      role="presentation"
      data-rad-modal-scrim=""
      {...portalAttrs}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn("rad-mb", className)}
        data-rad-modal-panel=""
      >
        <h2 id={titleId}>{title}</h2>
        {children}
        {actions != null ? <div className="rad-acts">{actions}</div> : null}
      </div>
    </div>
  );

  if (typeof document === "undefined") return node;
  return createPortal(node, document.body);
}
