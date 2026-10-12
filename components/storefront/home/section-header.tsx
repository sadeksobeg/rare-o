import Link from "next/link";

export function SectionHeader({
  eyebrow,
  title,
  href,
  actionLabel,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-ro-line pb-3">
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ro-plum">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-xl tracking-wide text-ro-ink md:text-2xl">
          {title}
        </h2>
      </div>
      {href && actionLabel ? (
        <Link
          href={href}
          className="text-sm font-semibold text-ro-plum underline-offset-4 hover:underline"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
