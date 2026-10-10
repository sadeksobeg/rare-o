import { notFound } from "next/navigation";
import { Rings, Grain, Axis, Emblem } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { Banner } from "@/components/ui/banner";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader } from "@/components/ui/loader";
import { MaterialPlate } from "@/components/storefront/material-plate";
import { getRequestLocale } from "@/lib/i18n/server";

export const metadata = {
  title: "RARE OUD — UI gallery (dev)",
  robots: { index: false, follow: false },
};

const SWATCHES = [
  ["ink-950", "#0B080D"],
  ["ink-600", "#4B4056"],
  ["plum-900", "#32104F"],
  ["sand-100", "#F4E7D8"],
  ["sand-50", "#FBF6EE"],
  ["sand-200", "#EFE3D4"],
  ["amber-500", "#B8863F"],
  ["success-100", "#DCEBDD"],
  ["danger-100", "#F4DADC"],
] as const;

const CONTRAST = [
  ["ink-950 on sand-100", "16.37"],
  ["ink-600 on sand-100", "7.97"],
  ["plum-900 on sand-100", "13.06"],
  ["sand-100 on ink-950", "16.37"],
  ["amber-600 on sand-100", "4.84"],
] as const;

export default async function DevUiPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const locale = await getRequestLocale();

  return (
    <div className="min-h-screen bg-ro-canvas text-ro-ink">
      <header className="border-b border-ro-border px-6 py-6">
        <p className="ro-type-overline text-ro-plum">DEV ONLY · /dev/ui</p>
        <h1 className="ro-type-h1 mt-2">UI Foundations Gallery</h1>
        <p className="mt-2 max-w-2xl text-ro-text-2">
          Locale: <bdi>{locale}</bdi> · calibrate{" "}
          <code className="text-sm">--ro-display-scale</code> /{" "}
          <code className="text-sm">--ro-ui-scale</code> only. Production returns
          404.
        </p>
      </header>

      <main id="main-content" className="mx-auto max-w-5xl space-y-16 px-6 py-12">
        <section className="space-y-4">
          <h2 className="ro-type-h2">Palette</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {SWATCHES.map(([name, hex]) => (
              <div key={name} className="space-y-2">
                <div
                  className="aspect-[4/3] rounded-[var(--ro-r-sm)] border border-ro-border"
                  style={{ background: hex }}
                />
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-ro-muted">
                  <bdi>{hex}</bdi>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="ro-type-h2">Contrast (verified pairs)</h2>
          <ul className="divide-y divide-ro-border border border-ro-border bg-ro-paper">
            {CONTRAST.map(([pair, ratio]) => (
              <li
                key={pair}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span>{pair}</span>
                <span className="tabular-nums text-ro-plum">{ratio}:1</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="ro-type-h2">Type scale</h2>
          <div className="space-y-4 rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-paper p-6">
            <p className="ro-type-display-xl">
              {locale === "ar" ? "عودٌ نادر، صُنع ليبقى" : "A rare oud, made to last."}
            </p>
            <p className="ro-type-h1">
              {locale === "ar" ? "عنوان الصفحة" : "Page title"}
            </p>
            <p className="ro-type-h2">
              {locale === "ar" ? "عنوان القسم" : "Section title"}
            </p>
            <p className="ro-type-overline">RARE OUD</p>
            <p className="text-ro-text-2">
              {locale === "ar"
                ? "نص واجهة بخط IBM Plex Sans Arabic — فصحى راقية قصيرة."
                : "UI body in Source Sans 3 — formal English secondary."}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="ro-type-h2">Motifs</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="ro-inverse flex aspect-square items-center justify-center rounded-[var(--ro-r-sm)] p-8">
              <Rings className="h-full w-full text-ro-canvas" amberRingIndex={2} idle />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-[var(--ro-r-sm)] bg-ro-ink text-ro-canvas">
              <Grain className="absolute inset-0 h-full w-full" opacity={0.14} />
              <p className="relative z-10 flex h-full items-center justify-center ro-type-overline">
                Grain
              </p>
            </div>
            <div className="flex aspect-square flex-col items-center justify-center gap-6 rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-paper">
              <Axis height={80} withAmberDot className="bg-ro-ink opacity-80" />
              <Emblem variant="small" />
            </div>
          </div>
        </section>

        <section className="ro-inverse space-y-6 rounded-[var(--ro-r-sm)] p-8">
          <h2 className="ro-type-h2">Inverse surface</h2>
          <p className="max-w-xl text-ro-text-2">
            {locale === "ar"
              ? "الحلقات والكريمي على الحبر — مرجع لوحة الهوية."
              : "Rings and cream on ink — brand-board reference."}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="inverse-primary">
              {locale === "ar" ? "استكشف المجموعة" : "Explore the collection"}
            </Button>
            <Button variant="text" className="text-ro-canvas">
              {locale === "ar" ? "قصتنا" : "Our story"}
            </Button>
            <Axis height={48} className="bg-ro-canvas opacity-40" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="ro-type-h2">Primitives</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Loader label="loading" />
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusChip tone="info" label="submitted" />
            <StatusChip tone="attention" label="waiting" />
            <StatusChip tone="success" label="accepted" />
            <StatusChip tone="danger" label="failed" />
          </div>
          <Banner tone="info">
            {locale === "ar"
              ? "مثال على شريط تنبيه هادئ."
              : "Sample calm banner."}
          </Banner>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="aspect-[4/5]" />
            <Skeleton className="aspect-[4/5]" />
            <Skeleton className="aspect-[4/5]" />
          </div>
          <div className="mx-auto max-w-xs">
            <MaterialPlate
              caption={
                locale === "ar" ? "الصورة قيد التصوير" : "Photography in progress"
              }
            />
          </div>
          <EmptyState
            title={locale === "ar" ? "لا نتائج" : "No results"}
            body={locale === "ar" ? "جرّب مسح الفلاتر." : "Try clearing filters."}
            actionHref="/catalog"
            actionLabel={locale === "ar" ? "الكتالوج" : "Catalog"}
          />
        </section>
      </main>
    </div>
  );
}
