"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { LogoScene } from "@/components/brand/logo-scene";
import { Button } from "@/components/ui/button";
import { LocaleToggle } from "@/components/brand/locale-toggle";
import { cn } from "@/lib/utils";
import { useDict } from "@/lib/i18n";
import { storefrontDict } from "@/lib/dictionaries";

const craftItems = [
  { key: "craftWood" as const, descKey: "craftWoodDesc" as const },
  { key: "craftHand" as const, descKey: "craftHandDesc" as const },
  { key: "craftInspect" as const, descKey: "craftInspectDesc" as const },
];

const collections = [
  { titleKey: "collClassic" as const, countKey: "collClassicCount" as const, photo: "/brand/hero-oud-resonance.jpg" },
  { titleKey: "collStrings" as const, countKey: "collStringsCount" as const, photo: "/brand/hero-oud-majestic.jpg" },
  { titleKey: "collRare" as const, countKey: "collRareCount" as const, photo: "/brand/oud-heritage.jpg" },
];

export default function StorefrontHome() {
  const t = useDict(storefrontDict);
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    function onScroll() {
      setSolid(window.scrollY > window.innerHeight * 0.75);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bg-background">
      <nav
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 transition-colors duration-200",
          solid ? "bg-ro-sand-50 text-ro-ink-950 shadow-sm" : "text-ro-sand-100"
        )}
      >
        <Link href="/" className="flex items-center gap-2 font-[family-name:var(--font-heading)] font-semibold">
          <img src="/brand/logo-mark-small.svg" alt="" className={cn("h-5 w-5 transition-all", !solid && "invert")} />
          RARE OUD
        </Link>
        <div className="hidden items-center gap-6 text-small sm:flex">
          <a href="#craft" className="hover:opacity-80">
            {t("navCraft")}
          </a>
          <a href="#collections" className="hover:opacity-80">
            {t("navCollections")}
          </a>
          <Link href="/login" className="hover:opacity-80">
            {t("navAdmin")}
          </Link>
          <LocaleToggle className={cn(!solid && "border-ro-sand-100/40 bg-transparent text-ro-sand-100 hover:bg-ro-sand-100/10")} />
        </div>
      </nav>

      <section className="relative h-svh overflow-hidden bg-ro-ink-950">
        <div className="pointer-events-none absolute inset-[-10%] bg-[radial-gradient(40%_50%_at_22%_25%,rgba(82,39,124,.55),transparent_60%),radial-gradient(45%_55%_at_80%_75%,rgba(184,134,63,.2),transparent_62%)]" />
        <div className="absolute inset-x-0 top-[8%] bottom-[34%] flex items-center justify-center">
          <LogoScene className="h-[min(46vw,420px)] w-[min(46vw,420px)]" />
        </div>
        <div className="absolute inset-x-0 top-6 z-10 flex flex-col items-center gap-1.5 text-caption text-ro-ink-300">
          <span>{t("scrollDown")}</span>
          <ChevronDown className="size-4 animate-bounce motion-reduce:animate-none" strokeWidth={1.5} />
        </div>
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-ro-ink-950 via-ro-ink-950/60 to-transparent px-6 pb-16 pt-24 text-center">
          <span className="mb-3 block text-small text-ro-plum-300">{t("eyebrow")}</span>
          <h1 className="mx-auto max-w-[18ch] font-[family-name:var(--font-heading)] text-display text-ro-sand-100">
            {t("headline")}
          </h1>
          <p className="mx-auto mt-4 max-w-[50ch] text-body text-ro-ink-200">{t("heroSubtitle")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="bg-ro-sand-100 text-ro-ink-950 hover:bg-ro-sand-50" asChild>
              <a href="#collections">{t("exploreCollections")}</a>
            </Button>
            <Button size="lg" variant="outline" className="border-ro-sand-100/40 bg-transparent text-ro-sand-100 hover:bg-ro-sand-100/10" asChild>
              <Link href="/login">{t("traderPortal")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="craft" className="px-6 py-20">
        <div className="mx-auto grid max-w-5xl items-center gap-10 sm:grid-cols-[0.9fr_1.1fr]">
          <div className="aspect-[4/5] overflow-hidden rounded-xl">
            <img src="/brand/hero-closeup.jpg" alt="" className="size-full object-cover" />
          </div>
          <div>
            <blockquote className="font-[family-name:var(--font-heading)] text-h2 text-foreground">
              {t("quote")}
              <cite className="mt-4 block font-sans text-small not-italic text-muted-foreground">{t("quoteCite")}</cite>
            </blockquote>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {craftItems.map((item) => (
                <div key={item.key}>
                  <h3 className="mb-1 text-small font-medium">{t(item.key)}</h3>
                  <p className="text-caption leading-relaxed text-muted-foreground">{t(item.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="collections" className="bg-ro-sand-200 px-6 py-20">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-h2">{t("collectionsTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("collectionsSubtitle")}</p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
          {collections.map((c) => (
            <a
              key={c.titleKey}
              href="#"
              className="group relative flex aspect-[4/5] items-end overflow-hidden rounded-xl bg-ro-ink-900"
            >
              <img
                src={c.photo}
                alt=""
                className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <div className="relative z-10 w-full bg-gradient-to-t from-ro-ink-950/85 to-transparent p-4 text-ro-sand-100">
                <h3 className="text-h3 font-semibold">{t(c.titleKey)}</h3>
                <span className="text-caption text-ro-ink-200">{t(c.countKey)}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-ro-ink-950 px-6 py-16 text-center text-ro-sand-100">
        <div className="pointer-events-none absolute inset-[-20%] bg-[radial-gradient(45%_60%_at_50%_50%,rgba(82,39,124,.5),transparent_65%)]" />
        <h2 className="relative font-[family-name:var(--font-heading)] text-h2">{t("traderBandTitle")}</h2>
        <p className="relative mx-auto mt-3 max-w-[50ch] text-ro-ink-200">{t("traderBandSubtitle")}</p>
        <Button size="lg" className="relative mt-6 bg-ro-sand-100 text-ro-ink-950 hover:bg-ro-sand-50" asChild>
          <Link href="/login">{t("openTraderPortal")}</Link>
        </Button>
      </section>

      <footer className="px-6 py-8 text-center text-small text-muted-foreground">
        <p>
          RARE OUD · {t("footer")} · <bdi dir="ltr">info@rareoud.example</bdi>
        </p>
      </footer>
    </div>
  );
}
