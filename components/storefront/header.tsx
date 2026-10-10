"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { useCart } from "@/components/storefront/cart-provider";
import { BrandMark } from "@/components/storefront/brand-mark";
import { cn } from "@/lib/utils";
import { href, stripLocalePrefix } from "@/lib/href";
import Link from "next/link";

export function StorefrontHeader({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const nextLocale: Locale = locale === "ar" ? "en" : "ar";
  const { items } = useCart();
  const cartCount = items.reduce((n, i) => n + i.quantity, 0);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const prevCount = useRef(cartCount);
  const pathname = usePathname();
  const { path: barePath } = stripLocalePrefix(pathname || "/");
  const isHome = barePath === "/";
  const localeSwitchHref = href(barePath, nextLocale);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (cartCount > prevCount.current) {
      setCartPulse(true);
      const t = window.setTimeout(() => setCartPulse(false), 700);
      prevCount.current = cartCount;
      return () => window.clearTimeout(t);
    }
    prevCount.current = cartCount;
  }, [cartCount]);

  const nav = [
    { href: href("/catalog", locale), label: dict.nav.catalog },
    { href: href("/offers", locale), label: dict.nav.offers },
    { href: href("/contact", locale), label: dict.nav.contact },
  ];

  const overHero = isHome && !scrolled;

  const openSearch = () => {
    if (isHome) {
      window.dispatchEvent(new Event("ro:open-search"));
    } else {
      window.location.href = href("/catalog", locale);
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,color,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        overHero
          ? "border-b border-transparent bg-transparent text-ro-cream"
          : scrolled
            ? "border-b border-ro-line bg-ro-cream/95 text-ro-black backdrop-blur-md"
            : "border-b border-transparent bg-ro-cream text-ro-black"
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-5 transition-[padding] duration-500 md:px-8 lg:px-12",
          scrolled ? "py-3.5" : "py-5 md:py-6"
        )}
      >
        <Link
          href={href("/", locale)}
          className="group flex items-center gap-3.5"
          onClick={() => setOpen(false)}
        >
          <BrandMark
            variant="small"
            tone={overHero ? "on-dark" : "on-light"}
            size="sm"
            priority
            className="transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <span className="font-display text-[1.05rem] tracking-[0.32em] transition-colors duration-500 md:text-xl">
            {dict.brand}
          </span>
        </Link>

        <nav
          className={cn(
            "hidden items-center gap-12 text-[0.68rem] tracking-[0.22em] uppercase lg:flex",
            overHero ? "text-ro-ivory-muted" : "text-ro-muted"
          )}
          aria-label="Primary"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative py-1 transition-colors duration-300 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-center after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100",
                overHero
                  ? "hover:text-ro-cream after:bg-ro-cream"
                  : "hover:text-ro-black after:bg-ro-purple"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 md:gap-4">
          <button
            type="button"
            onClick={openSearch}
            className={cn(
              "hidden border px-2.5 py-1.5 text-[0.65rem] tracking-[0.2em] uppercase transition-all duration-300 sm:inline-flex",
              overHero
                ? "border-ro-line-on-dark text-ro-cream hover:border-ro-cream"
                : "border-ro-line text-ro-muted hover:border-ro-black hover:text-ro-black"
            )}
            aria-label={dict.home.search}
          >
            {dict.home.search}
          </button>

          <Link
            href={localeSwitchHref}
            className={cn(
              "min-w-[2.5rem] border px-2.5 py-1.5 text-center text-[0.65rem] tracking-[0.22em] transition-all duration-300",
              overHero
                ? "border-ro-line-on-dark text-ro-cream hover:border-ro-cream hover:bg-ro-cream hover:text-ro-black"
                : "border-ro-line text-ro-black hover:border-ro-black hover:bg-ro-black hover:text-ro-cream"
            )}
            aria-label={dict.common.language}
            hrefLang={nextLocale}
          >
            {dict.common.language}
          </Link>

          <Link
            href={href("/cart", locale)}
            className={cn(
              "group relative inline-flex items-center gap-2 border border-transparent px-2.5 py-1.5 text-[0.68rem] tracking-[0.18em] uppercase transition-all duration-300",
              overHero
                ? "text-ro-ivory-muted hover:border-ro-line-on-dark hover:text-ro-cream"
                : "text-ro-muted hover:border-ro-line hover:text-ro-black"
            )}
          >
            <span className="hidden transition-transform duration-300 group-hover:-translate-y-px sm:inline">
              {dict.nav.cart}
            </span>
            <span
              className={cn(
                "flex h-5 min-w-5 items-center justify-center px-1 text-[0.6rem] transition-transform duration-300",
                cartPulse && "scale-125",
                cartCount > 0
                  ? "bg-ro-purple text-ro-cream"
                  : overHero
                    ? "bg-ro-line-on-dark text-ro-cream"
                    : "bg-ro-surface text-ro-muted"
              )}
            >
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          </Link>

          <button
            type="button"
            className={cn(
              "flex h-10 w-10 items-center justify-center border transition-colors lg:hidden",
              overHero
                ? "border-ro-line-on-dark text-ro-cream"
                : "border-ro-line text-ro-black hover:border-ro-black"
            )}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? dict.common.close : dict.common.menu}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">
              {open ? dict.common.close : dict.common.menu}
            </span>
            <span className="flex w-4 flex-col gap-1.5" aria-hidden>
              <span
                className={cn(
                  "h-px w-full bg-current transition-transform duration-300",
                  open && "translate-y-[3.5px] rotate-45"
                )}
              />
              <span
                className={cn(
                  "h-px w-full bg-current transition-opacity duration-300",
                  open && "opacity-0"
                )}
              />
              <span
                className={cn(
                  "h-px w-full bg-current transition-transform duration-300",
                  open && "-translate-y-[3.5px] -rotate-45"
                )}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "fixed inset-0 top-[65px] z-40 bg-ro-cream text-ro-black lg:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav
          className="mx-auto flex h-full max-w-[1440px] flex-col justify-between px-5 py-10 md:px-8"
          aria-label="Mobile"
        >
          <div className="flex flex-col">
            <button
              type="button"
              className="border-b border-ro-line py-6 text-start font-display text-3xl tracking-wide"
              onClick={() => {
                setOpen(false);
                openSearch();
              }}
            >
              {dict.home.search}
            </button>
            <Link
              href={href("/", locale)}
              className="font-display border-b border-ro-line py-6 text-3xl tracking-wide"
              onClick={() => setOpen(false)}
            >
              {dict.nav.home}
            </Link>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-display border-b border-ro-line py-6 text-3xl tracking-wide"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={href("/cart", locale)}
              className="font-display border-b border-ro-line py-6 text-3xl tracking-wide text-ro-muted"
              onClick={() => setOpen(false)}
            >
              {dict.nav.cart}
              {cartCount > 0 ? ` (${cartCount})` : ""}
            </Link>
          </div>
          <div className="flex items-end justify-between gap-4 pb-8">
            <BrandMark variant="master" tone="on-light" size="lg" />
            <p className="max-w-[11rem] text-end text-[0.65rem] leading-relaxed tracking-[0.14em] text-ro-muted uppercase">
              {dict.home.footerTagline}
            </p>
          </div>
        </nav>
      </div>
    </header>
  );
}
