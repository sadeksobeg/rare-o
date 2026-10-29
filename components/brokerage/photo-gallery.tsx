import { parsePhotoPaths } from "@/lib/brokerage/media-shared";
import { cn } from "@/lib/utils";

export function BrokeragePhotoGallery({
  pathsJson,
  paths,
  title,
  emptyLabel,
  className,
}: {
  pathsJson?: string | null;
  paths?: string[];
  title: string;
  emptyLabel?: string;
  className?: string;
}) {
  const list =
    paths ?? (pathsJson != null ? parsePhotoPaths(pathsJson) : []);

  if (list.length === 0) {
    if (!emptyLabel) return null;
    return (
      <div
        className={cn(
          "rounded-[var(--ro-r-lg)] border border-dashed border-[var(--ro-border)] px-4 py-6 text-center text-sm text-[var(--ro-ink-500)]",
          className
        )}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-4",
        className
      )}
    >
      <h2 className="mb-3 font-display text-base font-semibold text-ro-ink">
        {title}
        <span className="ms-2 text-xs font-sans font-normal tabular-nums text-[var(--ro-ink-500)]">
          {list.length}
        </span>
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {list.map((src) => (
          <li key={src}>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-square overflow-hidden rounded-[var(--ro-r-md)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-200)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="size-full object-cover transition-transform duration-[var(--ro-dur-fast)] hover:scale-[1.02]"
                loading="lazy"
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
