"use client";

import { useEffect, useId, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import {
  BROKERAGE_MAX_BYTES,
  BROKERAGE_MAX_PHOTOS,
} from "@/lib/brokerage/media-shared";
import { cn } from "@/lib/utils";

type Preview = { id: string; file: File; url: string };

export function BrokeragePhotoField({
  locale,
  name = "photos",
  max = BROKERAGE_MAX_PHOTOS,
  alreadyCount = 0,
  className,
}: {
  locale: string;
  name?: string;
  max?: number;
  alreadyCount?: number;
  className?: string;
}) {
  const ar = locale === "ar";
  const inputId = useId();
  const room = Math.max(0, max - alreadyCount);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke on unmount only
  }, []);

  function onPick(list: FileList | null) {
    if (!list || list.length === 0) return;
    setHint(null);
    const incoming = Array.from(list);
    const next: Preview[] = [...previews];
    for (const file of incoming) {
      if (next.length >= room) {
        setHint(
          ar
            ? `الحد الأقصى ${max} صور.`
            : `Maximum ${max} photos.`
        );
        break;
      }
      if (file.size > BROKERAGE_MAX_BYTES) {
        setHint(
          ar ? "ملف يتجاوز 8 ميغابايت وتُجاهل." : "A file over 8 MB was skipped."
        );
        continue;
      }
      if (
        file.type &&
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      ) {
        setHint(
          ar
            ? "يُسمح بـ JPEG / PNG / WebP فقط."
            : "Only JPEG / PNG / WebP allowed."
        );
        continue;
      }
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${next.length}`,
        file,
        url: URL.createObjectURL(file),
      });
    }
    setPreviews(next);
  }

  function removeAt(id: string) {
    setPreviews((prev) => {
      const hit = prev.find((p) => p.id === id);
      if (hit) URL.revokeObjectURL(hit.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  if (room <= 0) {
    return (
      <p className="text-xs text-[var(--ro-ink-500)]">
        {ar
          ? `تم بلوغ الحد الأقصى (${max} صور).`
          : `Photo limit reached (${max}).`}
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-ro-ink"
        >
          {ar ? "صور القطعة" : "Piece photos"}
        </label>
        <span className="text-[0.65rem] text-[var(--ro-ink-500)]">
          {ar
            ? `حتى ${room} · JPEG/PNG/WebP · 8MB`
            : `Up to ${room} · JPEG/PNG/WebP · 8MB`}
        </span>
      </div>

      <label
        htmlFor={inputId}
        className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--ro-r-md)] border border-dashed border-[var(--ro-border)] bg-[var(--ro-sand-100)] px-3 py-4 text-sm text-[var(--ro-ink-700)] transition-[border-color,background-color] duration-[var(--ro-dur-fast)] hover:border-[var(--ro-plum-300)] hover:bg-[color-mix(in_srgb,var(--ro-plum-50)_50%,var(--ro-sand-100))]"
      >
        <ImagePlus className="size-4 shrink-0" strokeWidth={1.5} />
        {ar ? "اختر صوراً أو التقط من الجهاز" : "Choose or capture photos"}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          onPick(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Only this input submits files (after client-side filter). */}
      <FileBinder name={name} files={previews.map((p) => p.file)} />

      {previews.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {previews.map((p) => (
            <li
              key={p.id}
              className="relative aspect-square overflow-hidden rounded-[var(--ro-r-md)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-200)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(p.id)}
                className="absolute end-1 top-1 grid size-8 place-items-center rounded-full bg-[color-mix(in_srgb,var(--ro-ink-950)_70%,transparent)] text-[var(--ro-sand-100)]"
                aria-label={ar ? "إزالة" : "Remove"}
              >
                <X className="size-3.5" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {hint ? (
        <p className="text-xs text-[var(--ro-amber-800)]">{hint}</p>
      ) : null}
    </div>
  );
}

/** Keeps real File objects in the form after client-side filtering. */
function FileBinder({ name, files }: { name: string; files: File[] }) {
  const [input, setInput] = useState<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!input) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    input.files = dt.files;
  }, [input, files]);

  return (
    <input
      ref={setInput}
      type="file"
      name={name}
      multiple
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      tabIndex={-1}
      aria-hidden
    />
  );
}
