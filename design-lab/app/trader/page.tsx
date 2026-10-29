"use client";

import Link from "next/link";
import { Handshake, Package, Compass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { currentTrader, traders } from "@/lib/fixtures";
import { useLocale, useDict } from "@/lib/i18n";
import { traderHomeDict } from "@/lib/dictionaries";

const me = traders.find((t) => t.id === "t1")!;

const taskCards = [
  {
    href: "/trader/deals",
    icon: Handshake,
    titleKey: "proposeDealTitle",
    descKey: "proposeDealDesc",
    photo: "/brand/hero-oud-atelier-a.jpg",
    scrim: "from-ro-ink-950/95 via-ro-ink-950/40",
  },
  {
    href: "/trader/wholesale",
    icon: Package,
    titleKey: "wholesaleTitle",
    descKey: "wholesaleDesc",
    photo: "/brand/hero-oud-atelier-b.jpg",
    scrim: "from-ro-ink-950/95 via-ro-ink-950/40",
  },
  {
    href: "/trader/brokerage",
    icon: Compass,
    titleKey: "brokerageTitle",
    descKey: "brokerageDesc",
    photo: "/brand/hero-closeup.jpg",
    scrim: "from-ro-plum-900/95 via-ro-ink-950/40",
  },
] as const;

const offers = [
  { titleAr: "مختارات وترية", titleEn: "Strings Selection", descAr: "قطع يختارها فريق RARE OUD", descEn: "Pieces hand-picked by the RARE OUD team", photo: "/brand/hero-oud-majestic.jpg" },
  { titleAr: "تحرير الأتيليه", titleEn: "Atelier Edit", descAr: "اختيار قصير من الورشة", descEn: "A short selection from the workshop", photo: "/brand/instrument-dark.jpg" },
  { titleAr: "إرث العود", titleEn: "Oud Heritage", descAr: "قطع نادرة معتّقة", descEn: "Rare, aged pieces", photo: "/brand/oud-heritage.jpg" },
];

export default function TraderHomePage() {
  const { locale } = useLocale();
  const t = useDict(traderHomeDict);
  const firstName = (locale === "ar" ? currentTrader.name : currentTrader.nameEn).split(" ")[0];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-h1 font-semibold">
          {locale === "ar" ? `طاب يومك، ${firstName}` : `Good day, ${firstName}`}
        </h1>
        <p className="mt-1 flex items-center gap-2 text-small text-muted-foreground">
          <span className="relative inline-flex size-2 rounded-full bg-ro-amber-500">
            <span className="absolute inset-0 animate-ping rounded-full bg-ro-amber-500" />
          </span>
          {t("statusLine")}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-h2 font-semibold">{t("startHere")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {taskCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative flex min-h-60 flex-col justify-end overflow-hidden rounded-xl text-ro-sand-100"
            >
              <img
                src={card.photo}
                alt=""
                className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${card.scrim} to-transparent`} />
              <div className="relative z-10 p-5">
                <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-ro-sand-100/15">
                  <card.icon className="size-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-h3 font-semibold">{t(card.titleKey)}</h3>
                <p className="mt-1 text-small text-ro-ink-200">{t(card.descKey)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-h2 font-semibold">{t("myStats")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent>
              <p className="mb-1 text-small text-muted-foreground">{t("dealsThisMonth")}</p>
              <p className="text-h2 font-bold tabular-nums">
                <NumberTicker value={me.dealsCount} />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="mb-1 text-small text-muted-foreground">{t("acceptRate")}</p>
              <p className="text-h2 font-bold tabular-nums">
                <NumberTicker value={me.acceptRate} />
                <span className="text-h3">%</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-h2 font-semibold">{t("offersNow")}</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {offers.map((o) => (
            <div key={o.titleAr} className="w-60 shrink-0 overflow-hidden rounded-lg border bg-card">
              <div className="h-28 overflow-hidden">
                <img src={o.photo} alt="" className="size-full object-cover" />
              </div>
              <div className="p-3">
                <h3 className="text-small font-medium">{locale === "ar" ? o.titleAr : o.titleEn}</h3>
                <p className="mt-0.5 text-caption text-muted-foreground">{locale === "ar" ? o.descAr : o.descEn}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
