"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { MaterialPlate } from "@/components/storefront/material-plate";
import type { MediaItem } from "@/components/storefront/product-media";
import { ProductZoomStage } from "@/components/storefront/product-zoom-stage";
import { cn } from "@/lib/utils";

export type ProductGalleryLabels = {
  /** Accessible name for the whole gallery, e.g. "Product images". */
  gallery: string;
  /** Thumbnail button name; `{n}` is the 1-based image number. */
  showImage: string;
  enlarge: string;
  prev: string;
  next: string;
  close: string;
  /** Lightbox counter; `{current}` and `{total}` are substituted. */
  counter: string;
};

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function isRtl() {
  return document.documentElement.dir === "rtl";
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * S11 — PDP gallery: scroll-snap stage (swipe on mobile), selectable thumbs,
 * arrow-key navigation, and a native <dialog> lightbox.
 */
export function ProductGallery({
  images,
  plateCaption,
  labels,
  priority = false,
  className,
}: {
  images: MediaItem[];
  plateCaption: string;
  labels: ProductGalleryLabels;
  priority?: boolean;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const stageRef = useRef<HTMLUListElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const count = images.length;

  const select = useCallback(
    (next: number, options?: { scroll?: boolean }) => {
      if (count === 0) return;
      const clamped = Math.min(count - 1, Math.max(0, next));
      setIndex(clamped);
      if (options?.scroll === false) return;
      const slide = stageRef.current?.children[clamped] as
        | HTMLElement
        | undefined;
      slide?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "nearest",
        inline: "center",
      });
    },
    [count]
  );

  // Keep `index` in sync while the user swipes / scrolls the stage.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || count < 2) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = Array.prototype.indexOf.call(stage.children, entry.target);
          if (i >= 0) setIndex(i);
        }
      },
      { root: stage, threshold: 0.6 }
    );
    Array.from(stage.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [count]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (lightboxOpen && !el.open) el.showModal();
    if (!lightboxOpen && el.open) el.close();
  }, [lightboxOpen]);

  const step = useCallback(
    (direction: 1 | -1) => select(index + direction),
    [index, select]
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (count < 2) return;
    // Visual right = "next" in LTR, "previous" in RTL.
    const forward = isRtl() ? "ArrowLeft" : "ArrowRight";
    const backward = isRtl() ? "ArrowRight" : "ArrowLeft";
    if (event.key === forward) {
      event.preventDefault();
      step(1);
    } else if (event.key === backward) {
      event.preventDefault();
      step(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(0);
    } else if (event.key === "End") {
      event.preventDefault();
      select(count - 1);
    }
  };

  if (count === 0) {
    return <MaterialPlate caption={plateCaption} className={className} />;
  }

  const current = images[index] ?? images[0];

  const thumb = (img: MediaItem, i: number, sizeClass: string) => {
    const active = i === index;
    return (
      <button
        type="button"
        aria-label={fill(labels.showImage, { n: i + 1 })}
        aria-current={active ? "true" : undefined}
        onClick={() => select(i)}
        className={cn(
          "relative block overflow-hidden rounded-[var(--ro-r-xs)] bg-ro-sunken outline-offset-2 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ro-focus)]",
          sizeClass,
          active ? "ring-2 ring-[var(--ro-plum-900)]" : "opacity-70 hover:opacity-100"
        )}
      >
        {img.kind === "video" ? (
          <video
            src={img.path}
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden
          />
        ) : (
          <Image src={img.path} alt="" fill sizes="72px" className="object-cover" />
        )}
      </button>
    );
  };

  return (
    <div
      className={cn("space-y-3", className)}
      role="group"
      aria-label={labels.gallery}
      onKeyDown={onKeyDown}
    >
      <div className="lg:grid lg:grid-cols-[4.5rem_minmax(0,1fr)] lg:gap-3">
        {count > 1 ? (
          <ul className="hidden max-h-[min(70vh,36rem)] flex-col gap-2 overflow-y-auto lg:flex">
            {images.map((img, i) => (
              <li key={`v-${img.path}-${i}`} className="shrink-0">
                {thumb(img, i, "size-[4.5rem]")}
              </li>
            ))}
          </ul>
        ) : (
          <span className="hidden lg:block" />
        )}

        <div className="relative min-w-0">
          {/* Mobile / tablet swipe stage */}
          <ul
            ref={stageRef}
            className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[var(--ro-r-xs)] bg-ro-sunken [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
          >
            {images.map((img, i) => (
              <li
                key={`${img.path}-${i}`}
                className="relative aspect-[4/5] w-full shrink-0 snap-center"
              >
                {img.kind === "video" ? (
                  <video
                    src={img.path}
                    className="absolute inset-0 h-full w-full object-cover"
                    controls
                    playsInline
                    preload="metadata"
                    aria-label={img.alt}
                  />
                ) : (
                  <button
                    type="button"
                    aria-label={`${labels.enlarge}: ${img.alt}`}
                    className="absolute inset-0 cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
                    onClick={() => {
                      select(i, { scroll: false });
                      setLightboxOpen(true);
                    }}
                  >
                    <Image
                      src={img.path}
                      alt={img.alt}
                      fill
                      sizes="100vw"
                      className="object-cover"
                      priority={priority && i === 0}
                    />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* Desktop zoom stage */}
          {current.kind === "video" ? (
            <div className="relative hidden aspect-[4/5] lg:block">
              <video
                src={current.path}
                className="absolute inset-0 h-full w-full object-cover"
                controls
                playsInline
                preload="metadata"
                aria-label={current.alt}
              />
            </div>
          ) : (
            <ProductZoomStage
              src={current.path}
              alt={current.alt}
              priority={priority}
              enlargeLabel={`${labels.enlarge}: ${current.alt}`}
              onEnlarge={() => setLightboxOpen(true)}
            />
          )}

          <span
            aria-hidden
            className="pointer-events-none absolute end-3 top-3 inline-flex size-9 items-center justify-center rounded-[var(--ro-r-full)] bg-ro-canvas/85 text-ro-ink"
          >
            <Expand className="size-4" />
          </span>
          {count > 1 ? (
            <p
              aria-hidden
              className="pointer-events-none absolute bottom-3 start-3 rounded-[var(--ro-r-full)] bg-ro-ink/70 px-2.5 py-1 text-xs text-ro-canvas tabular-nums lg:hidden"
            >
              {index + 1} / {count}
            </p>
          ) : null}
        </div>
      </div>

      {count > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {images.map((img, i) => (
            <li key={`h-${img.path}-${i}`} className="shrink-0">
              {thumb(img, i, "size-[72px]")}
            </li>
          ))}
        </ul>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto h-[min(92vh,60rem)] w-[min(96vw,64rem)] max-w-none overflow-hidden border-0 bg-ro-ink p-0 text-ro-canvas backdrop:bg-black/80"
        onClose={() => setLightboxOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setLightboxOpen(false);
        }}
      >
        {lightboxOpen ? (
          <div className="relative h-full w-full">
            <h2 id={titleId} className="sr-only">
              {current.alt}
            </h2>
            {current.kind === "video" ? (
              <video
                src={current.path}
                className="absolute inset-0 h-full w-full object-contain"
                controls
                playsInline
                autoPlay
                aria-label={current.alt}
              />
            ) : (
              <Image
                src={current.path}
                alt={current.alt}
                fill
                sizes="96vw"
                className="object-contain"
              />
            )}
            <button
              type="button"
              aria-label={labels.close}
              onClick={() => setLightboxOpen(false)}
              className="absolute end-3 top-3 inline-flex size-11 items-center justify-center rounded-[var(--ro-r-full)] bg-ro-canvas/90 text-ro-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
            >
              <X className="size-5" aria-hidden />
            </button>
            {count > 1 ? (
              <>
                <button
                  type="button"
                  aria-label={labels.prev}
                  disabled={index === 0}
                  onClick={() => step(-1)}
                  className="absolute start-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-[var(--ro-r-full)] bg-ro-canvas/90 text-ro-ink disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
                >
                  <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={labels.next}
                  disabled={index === count - 1}
                  onClick={() => step(1)}
                  className="absolute end-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-[var(--ro-r-full)] bg-ro-canvas/90 text-ro-ink disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
                >
                  <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
                </button>
                <p
                  role="status"
                  className="absolute bottom-3 start-1/2 -translate-x-1/2 rounded-[var(--ro-r-full)] bg-ro-ink/70 px-3 py-1 text-xs tabular-nums rtl:translate-x-1/2"
                >
                  {fill(labels.counter, { current: index + 1, total: count })}
                </p>
              </>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
