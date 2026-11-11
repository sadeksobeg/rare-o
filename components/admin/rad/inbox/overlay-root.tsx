"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/**
 * Single body-level host for inbox floating UI (menus, lightbox, sheets).
 * Avoids clipping by .rad-ibx / .rad-page overflow:hidden and transform ancestors.
 *
 * CRITICAL: --rad-* tokens are scoped to `.ro-portal[data-portal][data-theme]`.
 * The host MUST mirror those attributes or menus render translucent/uncolored.
 */
export const INBOX_OVERLAY_Z = {
  tip: 220,
  menu: 240,
  modal: 260,
  toast: 280,
} as const;

type OverlayCtx = {
  host: HTMLElement | null;
};

const Ctx = createContext<OverlayCtx>({ host: null });

function readPortalSource(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".ro-portal[data-portal]");
}

/** Copy portal + theme onto the body-level overlay host (and keep in sync). */
export function syncInboxOverlayHostAttrs(el: HTMLElement): void {
  const src = readPortalSource();
  const portal = src?.getAttribute("data-portal") || "admin";
  const theme =
    src?.getAttribute("data-theme") ||
    document.documentElement.getAttribute("data-theme") ||
    "dark";
  el.classList.add("ro-portal", "rad-overlay-root");
  el.setAttribute("data-portal", portal);
  el.setAttribute("data-theme", theme);
  el.setAttribute("data-inbox-overlay", "1");
}

export function InboxOverlayProvider({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let el = document.getElementById("rad-inbox-overlay-root");
    let created = false;
    if (!el) {
      el = document.createElement("div");
      el.id = "rad-inbox-overlay-root";
      document.body.appendChild(el);
      created = true;
    }
    syncInboxOverlayHostAttrs(el);
    setHost(el);

    const src = readPortalSource();
    const mo =
      src &&
      new MutationObserver(() => {
        if (el) syncInboxOverlayHostAttrs(el);
      });
    if (src && mo) {
      mo.observe(src, {
        attributes: true,
        attributeFilter: ["data-theme", "data-portal", "class"],
      });
    }

    return () => {
      mo?.disconnect();
      if (created && el?.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  const value = useMemo(() => ({ host }), [host]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInboxOverlayHost(): HTMLElement | null {
  return useContext(Ctx).host;
}

export function InboxOverlayPortal({
  children,
  z = INBOX_OVERLAY_Z.menu,
}: {
  children: ReactNode;
  z?: number;
}) {
  const host = useInboxOverlayHost();
  const [fallback, setFallback] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (host) return;
    const el = document.body;
    // Last-resort: still try to paint tokens onto a temp wrapper via CSS vars
    setFallback(el);
  }, [host]);

  useEffect(() => {
    if (host) syncInboxOverlayHostAttrs(host);
  }, [host]);

  const target = host ?? fallback;
  if (!target) return null;
  return createPortal(
    <div className="rad-overlay-layer" style={{ zIndex: z }} data-inbox-overlay-layer="">
      {children}
    </div>,
    target
  );
}
