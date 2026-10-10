"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { localizedName } from "@/lib/utils";
import { href } from "@/lib/href";
import { useDiscovery } from "./discovery-context";

export function CompareTray({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const { products, compareIds, toggleCompare, clearCompare } = useDiscovery();
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => compareIds.map((id) => products.find((p) => p.id === id)).filter(Boolean),
    [compareIds, products]
  );

  if (selected.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-ro-line bg-ro-cream/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-3 md:px-8 lg:px-12">
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto">
          <p className="shrink-0 text-[0.65rem] tracking-[0.22em] text-ro-purple uppercase">
            {dict.home.compare} ({selected.length}/3)
          </p>
          {selected.map((p) => {
            if (!p) return null;
            const name = localizedName(locale, p.nameAr, p.nameEn, p.slug);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleCompare(p.id)}
                className="shrink-0 border border-ro-line px-3 py-1.5 text-sm hover:border-ro-purple"
                title={dict.home.compareRemove}
              >
                {name} ×
              </button>
            );
          })}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={clearCompare}
            className="px-3 py-2 text-[0.65rem] tracking-[0.16em] uppercase text-ro-muted hover:text-ro-black"
          >
            {dict.home.compareClear}
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={selected.length < 2}
            className="bg-ro-purple px-4 py-2 text-[0.65rem] tracking-[0.16em] text-ro-cream uppercase disabled:opacity-40"
          >
            {dict.home.compareTitle}
          </button>
        </div>
      </div>

      {open && selected.length >= 2 ? (
        <div
          className="fixed inset-0 z-[75] bg-ro-black/50"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute inset-x-4 top-[8vh] mx-auto max-h-[84vh] max-w-5xl overflow-auto border border-ro-line bg-ro-cream p-6 shadow-2xl md:inset-x-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl tracking-wide">
                {dict.home.compareTitle}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[0.65rem] tracking-[0.2em] uppercase text-ro-muted"
              >
                {dict.home.quickViewClose}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-ro-line p-3 text-start text-[0.65rem] tracking-[0.16em] uppercase text-ro-muted" />
                    {selected.map((p) =>
                      p ? (
                        <th
                          key={p.id}
                          className="border-b border-ro-line p-3 text-start font-display text-lg font-normal"
                        >
                          <Link
                            href={href(`/product/${p.slug}`, locale)}
                            className="hover:text-ro-purple"
                          >
                            {localizedName(locale, p.nameAr, p.nameEn, p.slug)}
                          </Link>
                        </th>
                      ) : null
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      [
                        dict.catalog.title,
                        (p: (typeof selected)[number]) =>
                          p
                            ? localizedName(
                                locale,
                                p.category.nameAr,
                                p.category.nameEn
                              )
                            : "",
                      ],
                      [
                        dict.home.available,
                        (p: (typeof selected)[number]) =>
                          p
                            ? p.availability === "available"
                              ? dict.home.available
                              : dict.home.unavailable
                            : "",
                      ],
                      [
                        dict.home.price,
                        (p: (typeof selected)[number]) =>
                          p
                            ? `${Number(p.retailPrice).toLocaleString(locale)} ${p.currency}`
                            : "",
                      ],
                      [
                        dict.product.specs,
                        (p: (typeof selected)[number]) =>
                          p
                            ? localizedName(
                                locale,
                                p.specsTextAr,
                                p.specsTextEn
                              ) || "—"
                            : "—",
                      ],
                    ] as const
                  ).map(([label, getter]) => (
                    <tr key={label}>
                      <th className="border-b border-ro-line p-3 text-start align-top text-[0.65rem] tracking-[0.16em] uppercase text-ro-muted">
                        {label}
                      </th>
                      {selected.map((p) =>
                        p ? (
                          <td
                            key={p.id + label}
                            className="border-b border-ro-line p-3 align-top text-ro-muted whitespace-pre-wrap"
                          >
                            {getter(p)}
                          </td>
                        ) : null
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[0.65rem] tracking-[0.14em] text-ro-muted uppercase">
              {dict.home.compareMax}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
