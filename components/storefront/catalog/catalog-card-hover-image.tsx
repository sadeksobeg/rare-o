"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Lazy second catalog image — loads only after pointerenter so grid LCP stays primary-only.
 */
export function CatalogCardHoverImage({
  path,
  alt,
  className,
}: {
  path: string;
  alt: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden rounded-[var(--ro-r-xs)]",
        className
      )}
      onPointerEnter={() => setArmed(true)}
      aria-hidden
    >
      {armed ? (
        <Image
          src={path}
          alt={alt}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
          quality={72}
          className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
      ) : null}
    </div>
  );
}
