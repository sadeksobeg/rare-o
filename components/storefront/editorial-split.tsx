import Image from "next/image";
import { Axis, Grain } from "@/components/brand";
import { cn } from "@/lib/utils";

/** S22 — EditorialSplit: image + text 7/5, axis on desktop, `#story`, pull quote. */
export function EditorialSplit({
  eyebrow,
  title,
  body,
  pullQuote,
  imageSrc,
  imageAlt,
  className,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  pullQuote?: string;
  imageSrc?: string | null;
  imageAlt?: string;
  className?: string;
}) {
  return (
    <section
      id="story"
      className={cn(
        "border-y border-ro-border bg-ro-sunken",
        className
      )}
    >
      <div className="mx-auto grid max-w-[1440px] items-stretch gap-0 lg:grid-cols-12">
        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--ro-ink-900)] lg:col-span-7 lg:aspect-auto lg:min-h-[32rem]">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt ?? ""}
              fill
              loading="lazy"
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-[var(--ro-ink-800)] via-[var(--ro-ink-950)] to-[var(--ro-plum-900)]"
              aria-hidden
            />
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--ro-ink-950)]/45 via-transparent to-[var(--ro-plum-900)]/20"
          />
          <Grain
            className="pointer-events-none absolute inset-0 text-ro-canvas opacity-[0.06]"
            patternId="ro-editorial-grain"
          />
        </div>
        <div className="relative flex flex-col justify-center gap-6 px-5 py-14 sm:px-8 md:px-10 lg:col-span-5 lg:py-20">
          <div className="absolute inset-y-12 start-0 hidden w-px lg:block" aria-hidden>
            <Axis height={140} withAmberDot className="absolute start-0 top-1/2 -translate-y-1/2 opacity-50" />
          </div>
          {eyebrow ? (
            <p className="ro-type-overline text-ro-plum">{eyebrow}</p>
          ) : null}
          <h2 className="font-display text-3xl tracking-wide text-ro-ink md:text-4xl lg:text-[2.75rem]">
            {title}
          </h2>
          <p className="max-w-prose text-base leading-relaxed text-ro-text-2 md:text-lg">
            {body}
          </p>
          {pullQuote ? (
            <blockquote className="border-s-2 border-[var(--ro-amber-500)] ps-5 font-display text-xl leading-snug text-ro-ink md:text-2xl">
              {pullQuote}
            </blockquote>
          ) : null}
        </div>
      </div>
    </section>
  );
}
