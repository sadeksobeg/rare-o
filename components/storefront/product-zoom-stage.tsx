"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Desktop hover lens zoom for PDP (Amazon-style). Disabled under reduced motion. */
export function ProductZoomStage({
  src,
  alt,
  priority,
  onEnlarge,
  enlargeLabel,
  className,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  onEnlarge: () => void;
  enlargeLabel: string;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      aria-label={enlargeLabel}
      className={cn(
        "group relative hidden aspect-[4/5] w-full overflow-hidden rounded-[var(--ro-r-xs)] bg-ro-sunken focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ro-focus)] lg:block",
        className
      )}
      onClick={onEnlarge}
      onMouseLeave={() => setPos(null)}
      onMouseMove={(e) => {
        if (reduce) return;
        const box = ref.current?.getBoundingClientRect();
        if (!box) return;
        const x = ((e.clientX - box.left) / box.width) * 100;
        const y = ((e.clientY - box.top) / box.height) * 100;
        setPos({ x, y });
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 48vw"
        priority={priority}
        className={cn(
          "object-cover",
          pos && !reduce ? "opacity-0" : "opacity-100"
        )}
      />
      {pos && !reduce ? (
        <span
          aria-hidden
          className="absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: "220%",
            backgroundPosition: `${pos.x}% ${pos.y}%`,
          }}
        />
      ) : null}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[color-mix(in_srgb,var(--ro-ink-950)_08%,transparent)]"
      />
    </button>
  );
}
