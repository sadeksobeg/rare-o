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
 * Single body-level host for inbox floating UI (menus, future lightbox/confirm).
 * Avoids clipping by .rad-ibx / .rad-page overflow:hidden and transform ancestors.
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

export function InboxOverlayProvider({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let el = document.getElementById("rad-inbox-overlay-root");
    let created = false;
    if (!el) {
      el = document.createElement("div");
      el.id = "rad-inbox-overlay-root";
      el.className = "rad-overlay-root";
      el.setAttribute("data-inbox-overlay", "1");
      document.body.appendChild(el);
      created = true;
    }
    setHost(el);
    return () => {
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
    setFallback(document.body);
  }, [host]);

  const target = host ?? fallback;
  if (!target) return null;
  return createPortal(
    <div className="rad-overlay-layer" style={{ zIndex: z }}>
      {children}
    </div>,
    target
  );
}
