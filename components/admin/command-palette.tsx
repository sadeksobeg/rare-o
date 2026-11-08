"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { adminCommandPages } from "@/lib/admin/command-hits";
import { highlightMatch } from "@/lib/ui/highlight-match";
import { cn } from "@/lib/utils";

export type CommandPaletteLabels = {
  search: string;
  placeholder: string;
  empty: string;
  searching: string;
  close: string;
  quickActions: string;
  navigate: string;
  pages: Record<string, string>;
};

type Hit = {
  href: string;
  title: string;
  subtitle: string;
  kind: string;
};

export type CommandPaletteAction = {
  href: string;
  title: string;
};

function shortcutLabel() {
  if (typeof navigator === "undefined") return "Ctrl K";
  return /Mac|iPhone|iPad/i.test(navigator.platform) ? "⌘K" : "Ctrl K";
}

export function AdminCommandPalette({
  labels,
  actions = [],
}: {
  labels: CommandPaletteLabels;
  actions?: CommandPaletteAction[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [pending, setPending] = useState(false);
  const [active, setActive] = useState(0);
  const [kbd, setKbd] = useState("Ctrl K");
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const listId = useId();
  const pages = adminCommandPages(labels.pages ?? {});
  const actionHits: Hit[] = actions.map((item) => ({
    href: item.href,
    title: item.title,
    subtitle: "",
    kind: "action",
  }));
  const showingDefault = query.trim().length < 2;
  const shown = showingDefault ? [...actionHits, ...pages] : hits;
  const activeHref = shown[active]?.href;

  useEffect(() => {
    setKbd(shortcutLabel());
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onInputKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(shown.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = shown[active];
      if (hit) go(hit.href);
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-1 items-center">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ro-cmd-search-trigger flex h-11 w-full min-w-0 flex-1 items-center gap-2 rounded-[var(--ro-r-sm)] border border-[color:var(--pilot-border-subtle,var(--ro-border-subtle))] bg-[color:var(--pilot-bg-raised,var(--ro-bg-raised))] px-3 text-xs text-[color:var(--pilot-text-muted,var(--ro-text-muted))] transition-[border-color,background-color] duration-[var(--ro-dur-fast)] hover:border-[color:var(--pilot-border,var(--ro-border))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pilot-focus,var(--ro-focus))]"
      >
        <Search className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
        <span className="min-w-0 truncate">{labels.search}</span>
        <kbd className="ms-auto hidden rounded bg-[color-mix(in_srgb,var(--pilot-text,var(--ro-text))_10%,transparent)] px-1.5 py-0.5 font-medium text-[11px] text-[color:var(--pilot-text,var(--ro-text))] sm:inline-block">
          <bdi dir="ltr">{kbd}</bdi>
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ro-cmd-search-icon-only ro-icon-btn"
        aria-label={labels.search}
      >
        <Search className="size-4" strokeWidth={1.5} aria-hidden />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[color-mix(in_srgb,var(--ro-ink-950)_45%,transparent)] p-4 pt-[12vh]"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-lg overflow-hidden rounded-[12px] border border-[color:var(--pilot-border-subtle,var(--ro-border-subtle))] bg-[color:var(--pilot-bg-raised,var(--ro-bg-raised))] text-[color:var(--pilot-text,var(--ro-text))] shadow-[var(--shadow-3)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={titleId} className="sr-only">
              {labels.search}
            </h2>
            <div className="flex items-center gap-2 border-b border-[color:var(--pilot-border-subtle,var(--ro-border-subtle))] px-3">
              <Search
                className="size-4 text-[color:var(--pilot-text-muted,var(--ro-text-muted))]"
                strokeWidth={1.5}
                aria-hidden
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKey}
                placeholder={labels.placeholder}
                role="combobox"
                aria-expanded
                aria-controls={listId}
                aria-activedescendant={
                  activeHref ? `${listId}-${active}` : undefined
                }
                className="h-12 w-full bg-transparent text-sm text-[color:var(--pilot-text,var(--ro-text))] outline-none placeholder:text-[color:var(--pilot-text-muted,var(--ro-text-muted))]"
              />
            </div>
            <ul id={listId} role="listbox" className="max-h-[min(52vh,22rem)] overflow-auto p-1.5">
              {shown.length === 0 ? (
                <li className="px-3 py-4 text-sm text-[color:var(--pilot-text-muted,var(--ro-text-muted))]">
                  {pending ? labels.searching : labels.empty}
                </li>
              ) : (
                shown.map((hit, index) => (
                  <li
                    key={`${hit.kind}-${hit.href}-${hit.title}`}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === active}
                  >
                    {showingDefault &&
                    hit.kind === "action" &&
                    index === 0 ? (
                      <p
                        role="presentation"
                        className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--pilot-text-muted,var(--ro-text-muted))]"
                      >
                        {labels.quickActions}
                      </p>
                    ) : null}
                    {showingDefault &&
                    hit.kind === "page" &&
                    shown[index - 1]?.kind === "action" ? (
                      <p
                        role="presentation"
                        className="mt-1 border-t border-[color:var(--pilot-border-subtle,var(--ro-border-subtle))] px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--pilot-text-muted,var(--ro-text-muted))]"
                      >
                        {labels.navigate}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => go(hit.href)}
                      onMouseEnter={() => setActive(index)}
                      className={cn(
                        "flex w-full flex-col items-start rounded-[8px] px-3 py-2 text-start",
                        index === active
                          ? "bg-[color-mix(in_srgb,var(--pilot-plum-700,var(--ro-plum-700))_16%,transparent)]"
                          : "hover:bg-[color-mix(in_srgb,var(--pilot-text,var(--ro-text))_6%,transparent)]"
                      )}
                    >
                      <span className="text-sm font-medium text-[color:var(--pilot-text,var(--ro-text))]">
                        {query.trim().length >= 2
                          ? highlightMatch(hit.title, query)
                          : hit.title}
                      </span>
                      {hit.subtitle ? (
                        <span className="text-[11px] text-[color:var(--pilot-text-muted,var(--ro-text-muted))]">
                          {query.trim().length >= 2
                            ? highlightMatch(hit.subtitle, query)
                            : hit.subtitle}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
