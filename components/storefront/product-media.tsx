import Image from "next/image";
import { MaterialPlate } from "@/components/storefront/material-plate";
import { cn } from "@/lib/utils";

export type MediaItem = {
  path: string;
  alt: string;
};

export function ProductMedia({
  images,
  plateCaption,
  priority = false,
  className,
}: {
  images: MediaItem[];
  plateCaption: string;
  priority?: boolean;
  className?: string;
}) {
  if (images.length === 0) {
    return <MaterialPlate caption={plateCaption} className={className} />;
  }

  const primary = images[0];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--ro-r-xs)] bg-ro-sunken">
        <Image
          src={primary.path}
          alt={primary.alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority={priority}
        />
      </div>
      {images.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto">
          {images.map((img) => (
            <li
              key={img.path}
              className="relative size-[72px] shrink-0 overflow-hidden rounded-[var(--ro-r-xs)] bg-ro-sunken"
            >
              <Image
                src={img.path}
                alt={img.alt}
                fill
                sizes="72px"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ProductThumb({
  path,
  alt,
  plateCaption,
  className,
}: {
  path?: string | null;
  alt: string;
  plateCaption: string;
  className?: string;
}) {
  if (!path) {
    return (
      <MaterialPlate
        compact
        caption={plateCaption}
        className={cn("aspect-[4/5] w-full", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-[4/5] overflow-hidden rounded-[var(--ro-r-xs)] bg-ro-sunken",
        className
      )}
    >
      <Image
        src={path}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, 33vw"
        className="object-cover"
      />
    </div>
  );
}
