import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

/** Local MIT geometric flag mark — falls back to ISO letters if file missing. */
export function CountryFlag({
  code,
  className,
  title,
}: {
  code: string;
  className?: string;
  title?: string;
}) {
  const iso = code.trim().toUpperCase().slice(0, 2);
  // ?v=2 busts the 7-day cache of the old hand-drawn flags
  const src = `/brand/flags/${iso}.svg?v=2`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      title={title || iso}
      width={24}
      height={16}
      className={cn(
        "inline-block h-4 w-6 shrink-0 rounded-[2px] object-contain bg-ro-paper ring-1 ring-[color-mix(in_srgb,var(--ro-ink)_14%,transparent)]",
        className
      )}
      loading="lazy"
      onError={(e) => {
        const el = e.currentTarget;
        el.style.display = "none";
        const sib = el.nextElementSibling as HTMLElement | null;
        if (sib) sib.hidden = false;
      }}
    />
  );
}

export function CountryFlagWithFallback({
  code,
  className,
  title,
}: {
  code: string;
  className?: string;
  title?: string;
}) {
  const iso = code.trim().toUpperCase().slice(0, 2);
  return (
    <span className={cn("inline-flex items-center", className)}>
      <CountryFlag code={iso} title={title} />
      <span
        hidden
        className="inline-flex h-4 min-w-6 items-center justify-center rounded-[2px] bg-ro-sunken px-0.5 text-[9px] font-semibold tabular-nums text-ro-muted"
        aria-hidden
      >
        {iso}
      </span>
    </span>
  );
}

/** Flag for countries; a pin for Syrian governorates (a governorate has no flag). */
export function DestinationMark({
  code,
  kind,
  title,
  className,
}: {
  code: string;
  kind: "syria" | "intl";
  title?: string;
  className?: string;
}) {
  if (kind === "syria") {
    return (
      <span
        className={cn(
          "inline-flex h-4 w-6 shrink-0 items-center justify-center rounded-[2px] bg-ro-sunken text-ro-muted",
          className
        )}
        title={title}
        aria-hidden
      >
        <MapPin className="size-3" strokeWidth={1.75} />
      </span>
    );
  }
  return <CountryFlagWithFallback code={code} title={title} className={className} />;
}
