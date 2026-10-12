import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Rings } from "@/components/brand";
import { cn } from "@/lib/utils";

/**
 * Curated public offer card. Text-only by design (offers carry no imagery);
 * `href` must already be locale-aware (use `href(path, locale)`).
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
        "group relative flex h-full flex-col gap-4 overflow-hidden border transition-[border-color,transform,background-color] duration-300",
        featured ? "p-8 md:p-10" : "p-6 md:p-7",
        dark
          ? "border-ro-line-on-dark bg-[var(--ro-ink-950)] text-ro-cream hover:border-ro-cream"
          : "border-ro-line bg-ro-paper text-ro-black hover:border-ro-plum",
        className
      )}
    >
      <Rings
        className={cn(
          "pointer-events-none absolute -end-16 -top-16 size-56 opacity-[0.07] transition-opacity duration-500 group-hover:opacity-[0.14]",
          dark ? "text-ro-cream" : "text-ro-ink"
        )}
      />
      {eyebrow ? (
        <p
          className={cn(
            "relative text-xs tracking-normal ltr:text-[0.65rem] ltr:tracking-[0.2em] ltr:uppercase",
            dark ? "text-ro-ivory-muted" : "text-ro-muted"
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <Heading
        className={cn(
          "relative font-display leading-snug tracking-wide",
          featured
            ? "text-3xl md:text-[2.1rem]"
            : "text-2xl md:text-[1.7rem]"
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
            featured ? "line-clamp-4 text-base" : "line-clamp-3 text-sm",
            dark ? "text-ro-ivory-muted" : "text-ro-muted"
          )}
        >
          {summary}
        </p>
      ) : null}
      <p
        className={cn(
          "relative mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold",
          dark ? "text-ro-cream" : "text-ro-plum"
        )}
      >
        <span>{ctaLabel}</span>
        <ArrowRight
          className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
          aria-hidden
        />
      </p>
    </article>
  );
}
