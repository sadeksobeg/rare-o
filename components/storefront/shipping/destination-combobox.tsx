"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, MapPin, Search } from "lucide-react";
import { CountryFlagWithFallback } from "@/components/storefront/shipping/flag";
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
  const inputId = id || `${autoId}-input`;
  const all = useMemo(() => listDestinationOptions(), []);
  const selected = all.find((d) => d.code === value) ?? null;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (!open) {
      setQuery(
        selected ? t(locale, selected.nameAr, selected.nameEn) : ""
      );
    }
  }, [selected, locale, open]);

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

  function pick(opt: DestinationOption) {
    rememberDestination(opt.code);
    onChange(opt.code, opt);
    setQuery(t(locale, opt.nameAr, opt.nameEn));
    setOpen(false);
  }

  const inputClass =
    portalTone === "admin"
      ? "h-10 w-full rounded-md border border-[color:var(--rad-bd)] bg-[color:var(--rad-c0)] pe-9 ps-10 text-sm outline-none focus:ring-2 focus:ring-[color:var(--rad-focus)]"
      : cn(
          "h-12 max-w-full w-full appearance-none rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper pe-9 ps-10 text-ro-ink outline-none transition-colors duration-[var(--ro-dur-fast)] focus:border-[var(--ro-plum-900)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--ro-focus)]",
          dense && "h-10 text-sm"
        );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <input type="hidden" name={name} value={value} />
      <MapPin
        className="pointer-events-none absolute top-1/2 z-[1] ms-3 size-4 -translate-y-1/2 text-ro-muted start-3"
        strokeWidth={1.5}
        aria-hidden
      />
      {selected ? (
        <span className="pointer-events-none absolute top-1/2 z-[1] -translate-y-1/2 pe-9 end-9">
          <CountryFlagWithFallback code={selected.flag} title={selected.nameEn} />
        </span>
      ) : null}
      <input
        ref={inputRef}
        id={inputId}
        data-testid="ro-shipping-destination"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        placeholder={t(
          locale,
          "ابحث عن الدولة أو المحافظة…",
          "Search country or governorate…"
        )}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value.trim() && value) onChange("", null);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActiveIdx((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(0, i - 1));
          } else if (e.key === "Enter" && open && filtered[activeIdx]) {
            e.preventDefault();
            pick(filtered[activeIdx]!);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={inputClass}
      />
      <ChevronDown
        className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-ro-muted"
        strokeWidth={1.5}
        aria-hidden
      />

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            "absolute inset-x-0 top-[calc(100%+4px)] z-50 max-h-64 overflow-auto rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper py-1 shadow-lg",
            portalTone === "admin" &&
              "border-[color:var(--rad-bd)] bg-[color:var(--rad-c0)] shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
          )}
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ro-muted">
              {t(locale, "لا نتائج", "No matches")}
            </li>
          ) : (
            filtered.map((d, i) => (
              <li key={`${d.kind}-${d.code}`} role="option" aria-selected={i === activeIdx}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm",
                    i === activeIdx || d.code === value
                      ? "bg-[color-mix(in_srgb,var(--ro-plum-900)_10%,transparent)]"
                      : "hover:bg-ro-sunken"
                  )}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => pick(d)}
                >
                  <CountryFlagWithFallback code={d.flag} />
                  <span className="min-w-0 flex-1 truncate font-medium text-ro-ink">
                    {t(locale, d.nameAr, d.nameEn)}
                  </span>
                  {d.kind === "syria" ? (
                    <span className="text-[10px] text-ro-muted">
                      {t(locale, "محافظة", "Gov.")}
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
          {query.trim() ? null : (
            <li className="border-t border-[var(--ro-border-control)] px-3 py-1.5 text-[11px] text-ro-muted">
              <Search className="me-1 inline size-3" strokeWidth={1.5} aria-hidden />
              {t(
                locale,
                "اكتب للبحث في كل الدول…",
                "Type to search all countries…"
              )}
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
