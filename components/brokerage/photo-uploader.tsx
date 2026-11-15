"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { ImagePlus, UploadCloud, X } from "lucide-react";
import { BROKERAGE_BATCH_MAX_PHOTOS, BROKERAGE_MAX_BYTES } from "@/lib/brokerage/media-shared";
import { cn } from "@/lib/utils";

type Item = { id: string; file: File; url: string };

const OK = ["image/jpeg", "image/png", "image/webp"];

/**
 * Premium photo picker: drag & drop zone, instant thumbnails, remove before sending, size meter.
 * Renders a real <input type="file" name="photos"> kept in sync so it works inside any <form>.
 */
export function PhotoUploader({
  max = BROKERAGE_BATCH_MAX_PHOTOS,
  name = "photos",
  resetKey,
}: {
  max?: number;
  name?: string;
  /** Change this value to clear the picker (e.g. after a successful send). */
  resetKey?: number | string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [items, setItems] = useState<Item[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;

  function sync(next: Item[]) {
    const el = inputRef.current;
    if (!el) return;
    const dt = new DataTransfer();
    next.forEach((i) => dt.items.add(i.file));
    el.files = dt.files;
  }

  function add(list: FileList | File[] | null) {
    if (!list) return;
    setHint(null);
    const next = [...itemsRef.current];
    for (const file of Array.from(list)) {
      if (next.length >= max) {
        setHint(`الحد الأقصى ${max} صور في كل دفعة.`);
        break;
      }
      if (file.size > BROKERAGE_MAX_BYTES) {
        setHint("تم تجاهل صورة يتجاوز حجمها 8 ميغابايت.");
        continue;
      }
      if (file.type && !OK.includes(file.type)) {
        setHint("المسموح: JPEG أو PNG أو WebP فقط.");
        continue;
      }
      next.push({ id: `${file.name}-${file.size}-${file.lastModified}-${next.length}`, file, url: URL.createObjectURL(file) });
    }
    setItems(next);
    sync(next);
  }

  function remove(itemId: string) {
    const next = itemsRef.current.filter((i) => {
      if (i.id === itemId) URL.revokeObjectURL(i.url);
      return i.id !== itemId;
    });
    setItems(next);
    sync(next);
  }

  useEffect(() => {
    itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url));
    setItems([]);
    sync([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the key changes
  }, [resetKey]);

  useEffect(
    () => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url)),
    []
  );

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    add(e.dataTransfer.files);
  }

  const totalMb = items.reduce((s, i) => s + i.file.size, 0) / (1024 * 1024);

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(e) => {
          // The native picker replaced the list: merge it with what we already hold.
          const picked = Array.from(e.target.files ?? []);
          const have = itemsRef.current.map((i) => i.file);
          const fresh = picked.filter((f) => !have.some((h) => h.name === f.name && h.size === f.size && h.lastModified === f.lastModified));
          if (fresh.length === 0) return sync(itemsRef.current);
          add(fresh);
        }}
      />
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
          over ? "border-[var(--rad-ac,#8a52c4)] bg-[color:color-mix(in_srgb,var(--rad-ac,#8a52c4)_12%,transparent)]" : "border-[color:var(--rad-bd2)] hover:bg-[color:var(--rad-surface3)]"
        )}
      >
        <span className="grid size-12 place-items-center rounded-full bg-[color:color-mix(in_srgb,var(--rad-ac,#8a52c4)_16%,transparent)] text-[color:var(--rad-ac,#8a52c4)]">
          <UploadCloud className="size-6" aria-hidden />
        </span>
        <b className="text-[15px] text-[color:var(--rad-tx)]">اسحب الصور هنا أو اضغط للاختيار</b>
        <span className="text-xs text-[color:var(--rad-tx3)]">حتى {max} صور · JPEG / PNG / WebP · 8 ميغابايت للصورة</span>
      </label>

      {items.length > 0 ? (
        <>
          <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {items.map((i) => (
              <li key={i.id} className="group relative aspect-square overflow-hidden rounded-xl border border-[color:var(--rad-bd)]">
                {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                <img src={i.url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => remove(i.id)}
                  aria-label="إزالة الصورة"
                  className="absolute end-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/65 text-white opacity-90 transition hover:bg-black/85"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            ))}
            {items.length < max ? (
              <li>
                <label
                  htmlFor={id}
                  className="grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed border-[color:var(--rad-bd2)] text-[color:var(--rad-tx3)] hover:bg-[color:var(--rad-surface3)]"
                >
                  <ImagePlus className="size-6" aria-hidden />
                </label>
              </li>
            ) : null}
          </ul>
          <p className="text-xs text-[color:var(--rad-tx3)]">
            {items.length} / {max} صورة · {totalMb.toFixed(1)} ميغابايت
          </p>
        </>
      ) : null}
      {hint ? (
        <p role="alert" className="text-xs font-medium text-[color:var(--ro-danger-700)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
