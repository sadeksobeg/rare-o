import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { href } from "@/lib/href";
import type { Locale } from "@/lib/i18n/config";
import { localizedName, cn } from "@/lib/utils";

export type PromoBandView = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  ctaLabelAr: string;
  ctaLabelEn: string;
  href: string;
  tone: string;
  imagePath: string | null;
};

const toneClass: Record<string, string> = {
  ink: "bg-[var(--ro-ink-950)] text-ro-canvas",
  plum: "bg-ro-plum text-ro-canvas",
  sand: "bg-[var(--ro-sand-100)] text-ro-ink",
};

export function PromoBands({
  bands,
  locale,
}: {
  bands: PromoBandView[];
  locale: Locale;
}) {
  if (bands.length === 0) return null;

  return (
    <div className="grid gap-2">
      {bands.map((band) => {
        const title = localizedName(
          locale,
          band.titleAr,
          band.titleEn,
          band.slug
        );
        const body = localizedName(locale, band.bodyAr, band.bodyEn);
        const cta = localizedName(
          locale,
          band.ctaLabelAr,
          band.ctaLabelEn,
          ""
        );
        const path = href(band.href, locale);
        const tone = toneClass[band.tone] ?? toneClass.ink;

        return (
          <article
            key={band.id}
            className={cn("flex flex-col gap-2 px-4 py-3", tone)}
          >
            <h3 className="text-sm font-semibold md:text-base">{title}</h3>
            {body ? (
              <p className="line-clamp-2 text-xs opacity-85 md:text-sm">{body}</p>
            ) : null}
            {cta ? (
              <Link
                href={path}
                className="inline-flex items-center gap-1 self-start text-xs font-semibold underline-offset-4 hover:underline md:text-sm"
              >
                {cta}
                <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
              </Link>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
