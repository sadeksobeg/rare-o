"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type Feature = { label: string; detail: string };

/** Vertical poetry rail — plum accent, atelier rhythm. */
export function HeroFeatureRail({
  dict,
  locale,
  className,
}: {
  dict: Dictionary;
  locale: Locale;
  className?: string;
}) {
  const isAr = locale === "ar";
  const items: Feature[] = [
    { label: dict.home.principleRare, detail: dict.home.heroFeatRare },
    { label: dict.home.principleSelected, detail: dict.home.heroFeatSelected },
    { label: dict.home.principleAuthentic, detail: dict.home.heroFeatAuthentic },
    { label: dict.home.principleConsidered, detail: dict.home.heroFeatConsidered },
  ];

  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [reduced, items.length]);

  return (
    <ul
      className={cn(
        "relative flex w-[12rem] shrink-0 flex-col justify-center gap-0 border-s border-[color-mix(in_srgb,var(--ro-plum-300)_28%,transparent)] ps-5 sm:w-[14rem]",
        isAr ? "text-start" : "text-left",
        className
      )}
      lang={locale}
      dir={isAr ? "rtl" : "ltr"}
      aria-label={dict.home.principlesTitle}
    >
      <li className="ro-type-overline mb-5 text-[var(--ro-plum-300)]">
        {dict.home.principlesEyebrow}
      </li>
      {items.map((item, i) => {
        const on = i === active;
        return (
          <li
            key={item.label}
            className={cn(
              "ro-hero-feat relative py-3 transition-[opacity,transform] duration-500 ease-[var(--ro-ease-standard)]",
              on ? "opacity-100" : "opacity-70"
            )}
            style={{ animationDelay: `${0.5 + i * 0.1}s` }}
            data-active={on || undefined}
          >
            <button
              type="button"
              className="block w-full text-start"
              onClick={() => setActive(i)}
              aria-current={on ? "true" : undefined}
            >
              <span
                className={cn(
                  "font-display text-xl tracking-wide transition-colors duration-500 md:text-2xl",
                  on
                    ? "text-[var(--ro-plum-300)]"
                    : "text-[color-mix(in_srgb,var(--ro-sand-100)_88%,transparent)]"
                )}
              >
                {item.label}
              </span>
              <span
                className={cn(
                  "mt-1.5 block max-w-[16ch] text-[0.7rem] leading-relaxed transition-all duration-500",
                  on
                    ? "translate-y-0 text-[color-mix(in_srgb,var(--ro-sand-100)_82%,transparent)] opacity-100"
                    : "pointer-events-none -translate-y-1 opacity-0"
                )}
              >
                {item.detail}
              </span>
            </button>
            <span
              aria-hidden
              className={cn(
                "absolute top-3 h-[calc(100%-1.5rem)] w-px bg-[var(--ro-plum-300)] transition-opacity duration-500",
                isAr ? "end-auto start-[-1.3rem]" : "start-[-1.3rem]",
                on ? "opacity-100" : "opacity-0"
              )}
            />
          </li>
        );
      })}
    </ul>
  );
}
