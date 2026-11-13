"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { DestinationMark } from "@/components/storefront/shipping/flag";
import {
  listDestinationOptions,
  type DestinationOption,
} from "@/lib/shipping/destination-options";
import {
  readRememberedDestination,
  rememberDestination,
} from "@/lib/shipping/quote-ui";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const t = (locale: Locale, ar: string, en: string) =>
  locale === "ar" ? ar : en;

export function DestinationCombobox({
  locale,
  value,
  onChange,
  id,
  name = "destinationCode",
  dense = false,
  className,
  portalTone = "storefront",
}: {
  locale: Locale;
  value: string;
  onChange: (code: string, option: DestinationOption | null) => void;
  id?: string;
  name?: string;
  dense?: boolean;
  className?: string;
  /** Admin uses denser tokens via class only — same component. */
  portalTone?: "storefront" | "admin";
}) {
  const autoId = useId();
  const listId = `${autoId}-list`;
  const searchId = id || `${autoId}-search`;
  const all = useMemo(() => listDestinationOptions(), []);
  const selected = all.find((d) => d.code === value) ?? null;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const rememberedRef = useRef(false);

  useEffect(() => {
    if (rememberedRef.current || value) return;
    rememberedRef.current = true;
    const remembered = readRememberedDestination();
    if (remembered && all.some((d) => d.code === remembered)) {
      const opt = all.find((d) => d.code === remembered) ?? null;
      onChange(remembered, opt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all.slice(0, 80);
    return all
      .filter(
        (d) =>
          d.code.toLowerCase().includes(q) ||
          d.nameAr.includes(query.trim()) ||
          d.nameEn.toLowerCase().includes(q)
      )
      .slice(0, 80);
  }, [all, query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query, open]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      // Focus search when the list opens (prove searchable UX).
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  function pick(opt: DestinationOption) {
    rememberDestination(opt.code);
    onChange(opt.code, opt);
    setOpen(false);
  }

  const triggerClass =
    portalTone === "admin"
      ? cn(
          "flex h-10 w-full items-center gap-2 rounded-md border border-[color:var(--rad-bd)] bg-[color:var(--rad-c0)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--rad-focus)]",
          dense && "h-9 text-xs"
        )
      : cn(
          "flex h-12 w-full max-w-full items-center gap-2 rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 text-ro-ink outline-none transition-colors duration-[var(--ro-dur-fast)] focus-visible:border-[var(--ro-plum-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
          dense && "h-10 text-sm"
        );

  const panelClass = cn(
    "absolute inset-x-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper shadow-lg",
    portalTone === "admin" &&
      "border-[color:var(--rad-bd)] bg-[color:var(--rad-c0)] shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
  );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        id={id}
        data-testid="ro-shipping-destination"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={triggerClass}
      >
        {selected ? (
          <DestinationMark
            code={selected.flag}
            kind={selected.kind}
            title={selected.nameEn}
            className="shrink-0"
          />
        ) : (
          <Search
            className="size-4 shrink-0 text-ro-muted"
            strokeWidth={1.5}
            aria-hidden
          />
        )}
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-start",
            selected ? "font-medium text-ro-ink" : "text-ro-muted"
          )}
        >
          {selected
            ? t(locale, selected.nameAr, selected.nameEn)
            : t(locale, "ابحث عن الدولة أو المحافظة…", "Search country or governorate…")}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-ro-muted transition-transform duration-[var(--ro-dur-fast)]",
            open && "rotate-180"
          )}
          strokeWidth={1.5}
          aria-hidden
        />
      </button>

      {open ? (
        <div className={panelClass}>
          <div className="border-b border-[var(--ro-border-control)] p-2">
            <label className="sr-only" htmlFor={searchId}>
              {t(locale, "بحث الدول", "Search countries")}
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 start-2.5 size-3.5 -translate-y-1/2 text-ro-muted"
                strokeWidth={1.5}
                aria-hidden
              />
              <input
                ref={searchRef}
                id={searchId}
                data-testid="ro-shipping-destination-search"
                type="search"
                autoComplete="off"
                value={query}
                placeholder={t(
                  locale,
                  "اكتب بالعربي أو الإنجليزي…",
                  "Type in Arabic or English…"
                )}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveIdx((i) =>
                      Math.min(i + 1, Math.max(0, filtered.length - 1))
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveIdx((i) => Math.max(0, i - 1));
                  } else if (e.key === "Enter" && filtered[activeIdx]) {
                    e.preventDefault();
                    pick(filtered[activeIdx]!);
                  } else if (e.key === "Escape") {
                    setOpen(false);
                  }
                }}
                className={cn(
                  "h-10 w-full rounded-md border border-[var(--ro-border-control)] bg-ro-paper pe-3 ps-8 text-sm outline-none focus:border-[var(--ro-plum-900)]",
                  portalTone === "admin" &&
                    "border-[color:var(--rad-bd)] bg-[color:var(--rad-c0)] focus:ring-2 focus:ring-[color:var(--rad-focus)]"
                )}
              />
            </div>
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-56 overflow-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-ro-muted">
                {t(locale, "لا نتائج", "No matches")}
              </li>
            ) : (
              filtered.map((d, i) => (
                <li
                  key={`${d.kind}-${d.code}`}
                  role="option"
                  aria-selected={i === activeIdx}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-start text-sm",
                    i === activeIdx || d.code === value
                      ? "bg-[color-mix(in_srgb,var(--ro-plum-900)_10%,transparent)]"
                      : "hover:bg-ro-sunken"
                  )}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => pick(d)}
                >
                  <DestinationMark code={d.flag} kind={d.kind} />
                  <span className="min-w-0 flex-1 truncate font-medium text-ro-ink">
                    {t(locale, d.nameAr, d.nameEn)}
                  </span>
                  {d.kind === "syria" ? (
                    <span className="text-[10px] text-ro-muted">
                      {t(locale, "محافظة", "Gov.")}
                    </span>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
