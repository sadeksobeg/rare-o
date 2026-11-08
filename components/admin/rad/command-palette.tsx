"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { adminCommandPages } from "@/lib/admin/command-hits";
import { highlightMatch } from "@/lib/ui/highlight-match";
import { cn } from "@/lib/utils";

export type RadPaletteAction = { href: string; title: string };

type Hit = { href: string; title: string; subtitle: string; kind: string };

export function RadCommandPalette({
  open,
  onOpenChange,
  placeholder,
  emptyTemplate,
  navGroupLabel,
  actionsGroupLabel,
  navHint,
  openHint,
  closeHint,
  pageLabels,
  actions,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  placeholder: string;
  emptyTemplate: string;
  navGroupLabel: string;
  actionsGroupLabel: string;
  navHint: string;
  openHint: string;
  closeHint: string;
  pageLabels: Record<string, string>;
  actions: RadPaletteAction[];
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [pending, setPending] = useState(false);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const listId = useId();

  const pages = adminCommandPages(pageLabels);
  const actionHits: Hit[] = actions.map((a) => ({
    href: a.href,
    title: a.title,
    subtitle: "",
    kind: "action",
  }));
  const showingDefault = query.trim().length < 2;
  const shown: Hit[] = useMemo(
    () => (showingDefault ? [...actionHits, ...pages] : hits),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showingDefault, hits, query]
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setHits([]);
      setActive(0);
      const id = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query, hits.length]);

  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) {
      setHits([]);
      setPending(false);
      return;
    }
    const ac = new AbortController();
    const handle = window.setTimeout(() => {
      setPending(true);
      fetch(`/api/admin/command-search?q=${encodeURIComponent(q)}`, {
        signal: ac.signal,
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((next: Hit[]) => setHits(Array.isArray(next) ? next : []))
        .catch(() => {
          if (!ac.signal.aborted) setHits([]);
        })
        .finally(() => {
          if (!ac.signal.aborted) setPending(false);
        });
    }, 180);
    return () => {
      window.clearTimeout(handle);
      ac.abort();
    };
  }, [query, open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (!open) return;
      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(shown.length - 1, i + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      }
      if (e.key === "Enter") {
        const hit = shown[active];
        if (hit) {
          onOpenChange(false);
          router.push(hit.href);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange, shown, active, router]);

  if (!open) return null;

  return (
    <div
      className="rad-ov"
      role="dialog"
      aria-modal="true"
      aria-label={placeholder}
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="rad-pal">
        <h2 id={titleId} className="sr-only">
          {placeholder}
        </h2>
        <div className="rad-pi">
          <Search width={20} height={20} strokeWidth={1.5} aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={shown[active] ? `${listId}-${active}` : undefined}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="rad-pl" id={listId} role="listbox">
          {shown.length === 0 ? (
            <div className="rad-empty" style={{ padding: 30 }}>
              <Search width={26} height={26} strokeWidth={1.5} aria-hidden />
              <b>{pending ? "…" : emptyTemplate.replace("{q}", query)}</b>
            </div>
          ) : (
            <>
              {showingDefault ? <div className="rad-pg">{actionsGroupLabel}</div> : null}
              {shown.map((hit, i) => {
                if (showingDefault && hit.kind === "page" && shown[i - 1]?.kind === "action") {
                  return (
                    <div key={hit.href}>
                      <div className="rad-pg">{navGroupLabel}</div>
                      <PaletteItem
                        hit={hit}
                        id={`${listId}-${i}`}
                        selected={active === i}
                        query={query}
                        onHover={() => setActive(i)}
                        onClick={() => {
                          onOpenChange(false);
                          router.push(hit.href);
                        }}
                      />
                    </div>
                  );
                }
                return (
                  <PaletteItem
                    key={`${hit.kind}-${hit.href}-${hit.title}`}
                    hit={hit}
                    id={`${listId}-${i}`}
                    selected={active === i}
                    query={query}
                    onHover={() => setActive(i)}
                    onClick={() => {
                      onOpenChange(false);
                      router.push(hit.href);
                    }}
                  />
                );
              })}
            </>
          )}
        </div>
        <div className="rad-pf">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            {navHint}
          </span>
          <span>
            <kbd>↵</kbd>
            {openHint}
          </span>
          <span>
            <kbd>Esc</kbd>
            {closeHint}
          </span>
        </div>
      </div>
    </div>
  );
}

function PaletteItem({
  hit,
  id,
  selected,
  query,
  onHover,
  onClick,
}: {
  hit: Hit;
  id: string;
  selected: boolean;
  query: string;
  onHover: () => void;
  onClick: () => void;
}) {
  const q = query.trim();
  return (
    <div
      id={id}
      role="option"
      aria-selected={selected}
      className={cn("rad-pit", selected && "rad-sel")}
      onMouseMove={onHover}
      onClick={onClick}
    >
      <span className="rad-chip" aria-hidden />
      <span>{q.length >= 2 ? highlightMatch(hit.title, q) : hit.title}</span>
      {hit.subtitle ? (
        <span style={{ color: "var(--rad-tx3)", fontSize: 11.5 }}>{hit.subtitle}</span>
      ) : null}
    </div>
  );
}
