import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Curated public offer card. Text-led; `href` must be locale-aware.
 */
export function OfferCard({
  href,
  title,
  summary,
  eyebrow,
  ctaLabel,
  tone = "light",
  headingLevel = 2,
  featured = false,
  className,
}: {
  href: string;
  title: string;
  summary?: string | null;
  eyebrow?: string;
  ctaLabel: string;
  tone?: "light" | "dark";
  headingLevel?: 2 | 3;
  featured?: boolean;
  className?: string;
}) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const dark = tone === "dark";

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col gap-5 overflow-hidden rounded-[var(--ro-r-sm)] border transition-[border-color,transform,background-color,box-shadow] duration-500 ease-[var(--ro-ease-standard)]",
        featured ? "min-h-[18rem] p-8 md:min-h-[22rem] md:p-12" : "p-6 md:p-8",
        dark
          ? "border-[color-mix(in_srgb,var(--ro-sand-200)_18%,transparent)] bg-[var(--ro-ink-950)] text-ro-cream hover:border-[color-mix(in_srgb,var(--ro-amber-500)_50%,transparent)] hover:-translate-y-1 hover:shadow-[0_28px_60px_-30px_rgba(0,0,0,0.55)]"
          : "border-ro-line bg-ro-paper text-ro-black hover:border-[color-mix(in_srgb,var(--ro-plum-700)_40%,var(--ro-border))] hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(11,8,13,0.28)]",
        "motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none",
        className
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 opacity-80",
          dark
            ? "bg-[radial-gradient(ellipse_55%_50%_at_100%_0%,rgba(184,134,63,0.16),transparent_65%)]"
            : "bg-[radial-gradient(ellipse_50%_45%_at_0%_100%,rgba(82,39,124,0.08),transparent_70%)]"
        )}
      />
      {eyebrow ? (
        <p
          className={cn(
            "relative ro-type-overline",
            dark ? "text-[var(--ro-amber-500)]" : "text-ro-plum"
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <Heading
        className={cn(
          "relative font-display leading-snug tracking-wide",
          featured
            ? "text-3xl md:text-[2.35rem]"
            : "text-2xl md:text-[1.75rem]"
        )}
      >
        <Link
          href={href}
          className="outline-offset-4 after:absolute after:inset-0 after:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ro-focus)]"
        >
          {title}
        </Link>
      </Heading>
      {summary ? (
        <p
          className={cn(
            "relative leading-relaxed",
            featured ? "max-w-2xl line-clamp-4 text-base md:text-lg" : "line-clamp-3 text-sm",
            dark ? "text-[var(--ro-ink-200)]" : "text-ro-muted"
          )}
        >
          {summary}
        </p>
      ) : null}
      <p
        className={cn(
          "relative mt-auto inline-flex items-center gap-2.5 pt-3 text-sm font-semibold",
          dark ? "text-[var(--ro-sand-100)]" : "text-ro-plum"
        )}
      >
        <span>{ctaLabel}</span>
        <ArrowRight
          className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
          aria-hidden
        />
      </p>
      <div
        aria-hidden
        className={cn(
          "absolute inset-x-0 bottom-0 h-0.5 origin-start scale-x-0 transition-transform duration-500 group-hover:scale-x-100",
          dark ? "bg-[var(--ro-amber-500)]" : "bg-[var(--ro-plum-700)]"
        )}
      />
    </article>
  );
}
