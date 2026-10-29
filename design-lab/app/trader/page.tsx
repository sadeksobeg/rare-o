"use client";

import Link from "next/link";
import { Handshake, Package, Compass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { currentTrader, traders } from "@/lib/fixtures";

const me = traders.find((t) => t.id === "t1")!;

const taskCards = [
  {
    href: "/trader/deals",
    icon: Handshake,
    titleAr: "اقترح صفقة",
    descAr: "قدّم عرضاً تجارياً على قطعة من الكتالوج أو خارجه",
    photo: "/brand/hero-oud-atelier-a.jpg",
    scrim: "from-ro-ink-950/95 via-ro-ink-950/40",
  },
  {
    href: "/trader/wholesale",
    icon: Package,
    titleAr: "اطلب بالجملة",
    descAr: "اختر القطع والكميات؛ الإدارة ترد بعرض السعر",
    photo: "/brand/hero-oud-atelier-b.jpg",
    scrim: "from-ro-ink-950/95 via-ro-ink-950/40",
  },
  {
    href: "/trader/brokerage",
    icon: Compass,
    titleAr: "اطلب وساطة",
    descAr: "رأيت قطعة نادرة في مكان ما؟ نعاينها ونشتريها لك",
    photo: "/brand/hero-closeup.jpg",
    scrim: "from-ro-plum-900/95 via-ro-ink-950/40",
  },
];

const offers = [
  { titleAr: "مختارات وترية", descAr: "قطع يختارها فريق RARE OUD", photo: "/brand/hero-oud-majestic.jpg" },
  { titleAr: "تحرير الأتيليه", descAr: "اختيار قصير من الورشة", photo: "/brand/instrument-dark.jpg" },
  { titleAr: "إرث العود", descAr: "قطع نادرة معتّقة", photo: "/brand/oud-heritage.jpg" },
];

export default function TraderHomePage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-h1 font-semibold">
          طاب يومك، {currentTrader.name.split(" ")[0]}
        </h1>
        <p className="mt-1 flex items-center gap-2 text-small text-muted-foreground">
          <span className="relative inline-flex size-2 rounded-full bg-ro-amber-500">
            <span className="absolute inset-0 animate-ping rounded-full bg-ro-amber-500" />
          </span>
          صفقة واحدة بانتظارك وعرض وساطة جديد — تحقّق أدناه
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-h2 font-semibold">ابدأ من هنا</h2>
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
                <h3 className="text-h3 font-semibold">{card.titleAr}</h3>
                <p className="mt-1 text-small text-ro-ink-200">{card.descAr}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-h2 font-semibold">إحصائياتي</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent>
              <p className="mb-1 text-small text-muted-foreground">صفقاتي هذا الشهر</p>
              <p className="text-h2 font-bold tabular-nums">
                <NumberTicker value={me.dealsCount} />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="mb-1 text-small text-muted-foreground">نسبة القبول</p>
              <p className="text-h2 font-bold tabular-nums">
                <NumberTicker value={me.acceptRate} />
                <span className="text-h3">%</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-h2 font-semibold">العروض المتاحة الآن</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {offers.map((o) => (
            <div key={o.titleAr} className="w-60 shrink-0 overflow-hidden rounded-lg border bg-card">
              <div className="h-28 overflow-hidden">
                <img src={o.photo} alt="" className="size-full object-cover" />
              </div>
              <div className="p-3">
                <h3 className="text-small font-medium">{o.titleAr}</h3>
                <p className="mt-0.5 text-caption text-muted-foreground">{o.descAr}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
