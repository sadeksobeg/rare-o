"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { InboxConversationListItem } from "@/lib/whatsapp/messaging/inbox";
import { InboxOverlayProvider } from "@/components/admin/rad/inbox/overlay-root";

type InboxUi = {
  ctxOpen: boolean;
  setCtxOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
};

const InboxUiContext = createContext<InboxUi | null>(null);

/** Shared by RadConversationList (search input) and RadThread (ctx toggle button) — both render as descendants of RadInboxShell even though a Server Component (layout.tsx/[id]/page.tsx) is what actually instantiates them as props/children. */
export function useInboxUi() {
  const ctx = useContext(InboxUiContext);
  if (!ctx) throw new Error("useInboxUi must be used within RadInboxShell");
  return ctx;
}

/**
 * Three-column grid container (list / thread / context). Routing itself is
 * the selection state — no SELID client state like the static reference —
 * this just derives "is a conversation open" from the pathname for the
 * mobile list<->thread transform, owns the context-panel slide-out toggle,
 * and the j/k/`/`/Escape shortcuts the brief asked for.
 */
export function RadInboxShell({
  rows,
  list,
  children,
}: {
  rows: InboxConversationListItem[];
  list: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ctxOpen, setCtxOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const activeId = pathname.match(/\/admin\/inbox\/([^/]+)/)?.[1] ?? null;
  const threadVisible = activeId !== null;

  useEffect(() => {
    setCtxOpen(false);
  }, [activeId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === "Escape") {
        if (ctxOpen) {
          setCtxOpen(false);
          return;
        }
        if (threadVisible) {
          router.push("/admin/inbox");
        }
        return;
      }
      if (e.key === "j" || e.key === "k") {
        if (rows.length === 0) return;
        const i = rows.findIndex((r) => r.id === activeId);
        const nextIndex = Math.max(0, Math.min(rows.length - 1, i + (e.key === "j" ? 1 : -1)));
        const next = rows[nextIndex];
        if (next && next.id !== activeId) router.push(`/admin/inbox/${next.id}`);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, activeId, threadVisible, ctxOpen, router]);

  return (
    <InboxOverlayProvider>
      <InboxUiContext.Provider value={{ ctxOpen, setCtxOpen, searchRef }}>
        <div className={`rad-ibx${threadVisible ? " rad-tv" : ""}${ctxOpen ? " rad-xo" : ""}`}>
          {/* Single keyed slots — page fragments used to pass 2 unkeyed siblings and trip the Next.js "1 Issue" badge */}
          <div key="inbox-list" className="rad-ib-list-slot">
            {list}
          </div>
          <div key="inbox-thread" className="rad-ib-thread-slot">
            {children}
          </div>
          {ctxOpen ? (
            <button
              type="button"
              className="rad-xp-scrim"
              aria-label="Close"
              onClick={() => setCtxOpen(false)}
            />
          ) : null}
        </div>
      </InboxUiContext.Provider>
    </InboxOverlayProvider>
  );
}
