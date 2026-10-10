"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { HomepageSearchItem } from "@/lib/catalog/homepage";
import { localizedName } from "@/lib/utils";
import { href } from "@/lib/href";
import { useDiscovery } from "./discovery-context";

export function SearchOverlay({
  dict,
  locale,
  items,
}: {
  dict: Dictionary;
  locale: Locale;
  items: HomepageSearchItem[];
}) {
  const { searchOpen, closeSearch } = useDiscovery();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchOpen) {
      setQ("");
      setActive(0);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [searchOpen, closeSearch]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items.slice(0, 8);
    return items
      .filter((p) => {
        const blob = [
          p.nameAr,
          p.nameEn,
          p.descriptionAr,
          p.descriptionEn,
          p.categoryNameAr,
          p.categoryNameEn,
        ]
          .join(" ")
          .toLowerCase();
        return blob.includes(term);
      })
      .slice(0, 12);
  }, [items, q]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  if (!searchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-ro-black/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={dict.home.search}
      onClick={closeSearch}
    >
      <div
        className="mx-auto mt-[10vh] max-w-2xl px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-hidden border border-ro-line-on-dark bg-ro-cream text-ro-black shadow-[0_30px_80px_rgba(11,8,13,0.35)]">
          <div className="flex items-center gap-3 border-b border-ro-line px-4 py-4">
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((i) => Math.min(results.length - 1, i + 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(0, i - 1));
                } else if (e.key === "Enter" && results[active]) {
                  window.location.href = href(
                    `/product/${results[active].slug}`,
                    locale
                  );
                }
              }}
              placeholder={dict.home.searchPlaceholder}
              className="w-full bg-transparent text-lg outline-none placeholder:text-ro-muted"
              aria-autocomplete="list"
              aria-controls="ro-search-results"
            />
            <button
              type="button"
              onClick={closeSearch}
              className="shrink-0 text-[0.65rem] tracking-[0.2em] uppercase text-ro-muted hover:text-ro-black"
            >
              {dict.home.closeSearch}
            </button>
          </div>

          <div id="ro-search-results" className="max-h-[50vh] overflow-y-auto">
            {results.length === 0 ? (
              <p className="px-4 py-8 text-sm text-ro-muted">{dict.home.searchEmpty}</p>
            ) : (
              <ul>
                {results.map((item, i) => {
                  const name = localizedName(
                    locale,
                    item.nameAr,
                    item.nameEn,
                    item.slug
                  );
                  const cat = localizedName(
                    locale,
                    item.categoryNameAr,
                    item.categoryNameEn
                  );
                  return (
                    <li key={item.id}>
                      <Link
                        href={href(`/product/${item.slug}`, locale)}
                        onClick={closeSearch}
                        className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                          i === active ? "bg-ro-surface" : "hover:bg-ro-surface/70"
                        }`}
                        onMouseEnter={() => setActive(i)}
                      >
                        <span className="h-12 w-12 shrink-0 overflow-hidden bg-ro-surface-dark">
                          {item.imagePath ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imagePath}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-lg">
                            {name}
                          </span>
                          <span className="text-[0.65rem] tracking-[0.16em] text-ro-muted uppercase">
                            {cat}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {q.trim() ? (
            <div className="border-t border-ro-line px-4 py-3">
              <Link
                href={`${href("/catalog", locale)}?q=${encodeURIComponent(q.trim())}`}
                onClick={closeSearch}
                className="text-[0.7rem] tracking-[0.18em] text-ro-purple uppercase"
              >
                {dict.home.searchResults} → {dict.nav.catalog}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
