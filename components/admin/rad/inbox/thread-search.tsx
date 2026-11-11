"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { InboxMessageItem } from "@/lib/whatsapp/messaging/inbox";

export function ThreadSearch({
  open,
  onOpenChange,
  messages,
  ib,
  containerRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: InboxMessageItem[];
  ib: Dictionary["ib"];
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as string[];
    return messages
      .filter((m) => {
        const hay = `${m.body || ""} ${m.caption || ""} ${m.mediaFileName || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .map((m) => m.id);
  }, [messages, query]);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open || !hits.length) return;
    const id = hits[Math.min(active, hits.length - 1)];
    const safe = (id || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const el = containerRef.current?.querySelector(`[data-msg-id="${safe}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.classList.add("rad-bb-hit");
      const t = window.setTimeout(() => el.classList.remove("rad-bb-hit"), 1200);
      return () => window.clearTimeout(t);
    }
  }, [active, hits, open, containerRef]);

  if (!open) return null;

  const total = hits.length;
  const current = total === 0 ? 0 : Math.min(active, total - 1) + 1;

  return (
    <div className="rad-tsearch" role="search">
      <Search width={16} height={16} strokeWidth={1.5} aria-hidden />
      <input
        ref={inputRef}
        type="search"
        value={query}
        placeholder={ib.threadSearchPlaceholder}
        aria-label={ib.searchInThread}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (!total) return;
            setActive((i) =>
              e.shiftKey ? (i - 1 + total) % total : (i + 1) % total
            );
          }
        }}
      />
      <span className="rad-tsearch-count" aria-live="polite">
        {query.trim()
          ? total === 0
            ? ib.threadSearchEmpty
            : ib.threadSearchCount
                .replace("{current}", String(current))
                .replace("{total}", String(total))
          : null}
      </span>
      <button
        type="button"
        className="rad-ib"
        aria-label={ib.threadSearchPrev}
        disabled={!total}
        onClick={() => setActive((i) => (i - 1 + total) % total)}
      >
        <ChevronUp width={16} height={16} strokeWidth={1.5} aria-hidden />
      </button>
      <button
        type="button"
        className="rad-ib"
        aria-label={ib.threadSearchNext}
        disabled={!total}
        onClick={() => setActive((i) => (i + 1) % total)}
      >
        <ChevronDown width={16} height={16} strokeWidth={1.5} aria-hidden />
      </button>
      <button
        type="button"
        className="rad-ib"
        aria-label={ib.threadSearchClose}
        onClick={() => onOpenChange(false)}
      >
        <X width={16} height={16} strokeWidth={1.5} aria-hidden />
      </button>
    </div>
  );
}

export function useThreadSearchHotkey(
  onOpen: () => void,
  enabled: boolean
): void {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "f") return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.(".rad-ct") || document.querySelector(".rad-ct:focus-within")) {
        e.preventDefault();
        onOpen();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enabled, onOpen]);
}
