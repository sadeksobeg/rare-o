"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { adminCommandPages } from "@/lib/admin/command-hits";
import { cn } from "@/lib/utils";

export type CommandPaletteLabels = {
  search: string;
  placeholder: string;
  empty: string;
  searching: string;
  close: string;
  pages: Record<string, string>;
};

type Hit = {
  href: string;
  title: string;
  subtitle: string;
  kind: string;
};

function shortcutLabel() {
  if (typeof navigator === "undefined") return "Ctrl K";
  return /Mac|iPhone|iPad/i.test(navigator.platform) ? "⌘K" : "Ctrl K";
}

export function AdminCommandPalette({
  labels,
}: {
  labels: CommandPaletteLabels;
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
  const shown = query.trim().length < 2 ? pages : hits;
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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 min-w-[11rem] items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--ro-ink-950)_16%,transparent)] bg-[var(--ro-sand-50)] px-3 text-xs text-[var(--ro-ink-600)] transition-[border-color,background-color,box-shadow] duration-[var(--ro-dur-fast)] hover:border-[var(--ro-plum-900)] hover:bg-white hover:shadow-[0_8px_18px_-14px_color-mix(in_srgb,var(--ro-plum-900)_45%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)] md:inline-flex"
      >
        <Search className="size-3.5" strokeWidth={1.5} aria-hidden />
        {labels.search}
        <kbd className="rounded bg-[var(--ro-sand-200)] px-1.5 py-0.5 font-medium text-[11px] text-ro-ink">
          {kbd}
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ro-icon-btn md:hidden"
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
            className="w-full max-w-lg overflow-hidden rounded-[12px] border border-[color-mix(in_srgb,var(--ro-ink-950)_14%,transparent)] bg-[var(--ro-sand-50)] shadow-[0_24px_60px_-28px_rgba(11,8,13,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={titleId} className="sr-only">
              {labels.search}
            </h2>
            <div className="flex items-center gap-2 border-b border-[color-mix(in_srgb,var(--ro-ink-950)_10%,transparent)] px-3">
              <Search
                className="size-4 text-[var(--ro-ink-600)]"
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
                className="h-12 w-full bg-transparent text-sm text-ro-ink outline-none placeholder:text-[var(--ro-ink-500)]"
              />
            </div>
            <ul id={listId} role="listbox" className="max-h-[min(52vh,22rem)] overflow-auto p-1.5">
              {shown.length === 0 ? (
                <li className="px-3 py-4 text-sm text-[var(--ro-ink-600)]">
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
                    <button
                      type="button"
                      onClick={() => go(hit.href)}
                      onMouseEnter={() => setActive(index)}
                      className={cn(
                        "flex w-full flex-col items-start rounded-[8px] px-3 py-2 text-start",
                        index === active
                          ? "bg-[var(--ro-sand-200)]"
                          : "hover:bg-[var(--ro-sand-200)]"
                      )}
                    >
                      <span className="text-sm font-medium text-ro-ink">
                        {hit.title}
                      </span>
                      {hit.subtitle ? (
                        <span className="text-[11px] text-[var(--ro-ink-600)]">
                          {hit.subtitle}
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
    </>
  );
}
