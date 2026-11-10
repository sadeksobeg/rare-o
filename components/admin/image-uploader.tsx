"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import {
  attachProductImageAction,
  removeProductImageAction,
  reorderProductImageAction,
  updateProductImageAltsAction,
  type ActionResult,
} from "@/app/actions";
import {
  SuggestEnAltPair,
  type SuggestEnLabels,
} from "@/components/admin/suggest-en";
import { ArrowDown, ArrowUp, ImagePlus, Pencil } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type MediaRow = {
  id: string;
  path: string;
  altAr: string;
  altEn: string;
  sortOrder: number;
  kind?: string;
};

const initial: ActionResult | null = null;

function errorLabel(dict: Dictionary["admin"], code: string | undefined) {
  switch (code) {
    case "TYPE":
      return dict.imagesErrorType;
    case "SIZE":
      return dict.imagesErrorSize;
    case "DIM":
      return dict.imagesErrorDim;
    case "MAX":
      return dict.imagesErrorMax;
    default:
      return dict.imagesErrorGeneric;
  }
}

export function ImageUploader({
  productId,
  images,
  dict,
  translate,
  bare = false,
  locale = "ar",
}: {
  productId: string;
  images: MediaRow[];
  dict: Dictionary["admin"];
  translate: SuggestEnLabels;
  /** Skip outer card chrome when wrapped in ui-kit Card. */
  bare?: boolean;
  locale?: string;
}) {
  const ar = locale === "ar";
  const [state, action, pending] = useActionState(
    attachProductImageAction,
    initial
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const body = (
    <div className="space-y-4">
      {!bare ? (
        <div>
          <h2
            className="font-display text-lg font-semibold"
            style={{ color: "var(--rad-tx)" }}
          >
            {dict.imagesTitle}
          </h2>
          <p className="mt-1 text-xs" style={{ color: "var(--rad-tx3)" }}>
            {dict.imagesLimits}
          </p>
        </div>
      ) : (
        <p className="text-xs" style={{ color: "var(--rad-tx3)" }}>
          {dict.imagesLimits}
        </p>
      )}

      {images.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--rad-tx3)" }}>
          {dict.imagesEmpty}
        </p>
      ) : (
        <ul className="space-y-3">
          {images.map((img, index) => {
            const isVideo = img.kind === "video";
            const isAudio = img.kind === "audio";
            return (
              <li
                key={img.id}
                className="flex flex-col gap-3 rounded-[12px] border p-3 sm:flex-row"
                style={{
                  borderColor: "var(--rad-bd)",
                  background: "var(--rad-surface2)",
                }}
              >
                {isAudio ? (
                  <div
                    className="relative flex w-full shrink-0 items-center gap-2 rounded-[10px] p-2.5 sm:w-56"
                    style={{ background: "var(--rad-surface3)" }}
                  >
                    {index === 0 ? (
                      <span
                        className="absolute start-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: "var(--rad-acf)",
                          color: "#fff",
                        }}
                      >
                        {dict.imagesPrimary}
                      </span>
                    ) : null}
                    <audio
                      src={img.path}
                      controls
                      preload="metadata"
                      className="h-9 min-w-0 flex-1"
                    />
                  </div>
                ) : (
                  <div
                    className="relative size-24 shrink-0 overflow-hidden rounded-[10px]"
                    style={{ background: "var(--rad-surface3)" }}
                  >
                    {isVideo ? (
                      <video
                        src={img.path}
                        className="size-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <Image
                        src={img.path}
                        alt={img.altAr || img.altEn || ""}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    )}
                    {index === 0 ? (
                      <span
                        className="absolute start-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: "var(--rad-acf)",
                          color: "#fff",
                        }}
                      >
                        {dict.imagesPrimary}
                      </span>
                    ) : null}
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <form
                    action={updateProductImageAltsAction}
                    className="space-y-2"
                  >
                    <input type="hidden" name="imageId" value={img.id} />
                    <input type="hidden" name="productId" value={productId} />
                    <SuggestEnAltPair
                      arLabel={dict.imagesAltAr}
                      enLabel={dict.imagesAltEn}
                      arDefault={img.altAr}
                      enDefault={img.altEn}
                      labels={translate}
                    />
                    <button
                      type="submit"
                      className="rad-btn rad-gh rad-sm inline-flex items-center gap-1.5"
                    >
                      <Pencil width={14} height={14} strokeWidth={1.5} aria-hidden />
                      {dict.edit}
                    </button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    <form action={reorderProductImageAction}>
                      <input type="hidden" name="imageId" value={img.id} />
                      <input type="hidden" name="productId" value={productId} />
                      <input type="hidden" name="direction" value="earlier" />
                      <button
                        type="submit"
                        className="rad-btn rad-gh rad-sm"
                        disabled={index === 0}
                        aria-label={dict.imagesMoveEarlier}
                      >
                        <ArrowUp width={16} height={16} strokeWidth={1.5} aria-hidden />
                      </button>
                    </form>
                    <form action={reorderProductImageAction}>
                      <input type="hidden" name="imageId" value={img.id} />
                      <input type="hidden" name="productId" value={productId} />
                      <input type="hidden" name="direction" value="later" />
                      <button
                        type="submit"
                        className="rad-btn rad-gh rad-sm"
                        disabled={index === images.length - 1}
                        aria-label={dict.imagesMoveLater}
                      >
                        <ArrowDown width={16} height={16} strokeWidth={1.5} aria-hidden />
                      </button>
                    </form>
                    <form action={removeProductImageAction}>
                      <input type="hidden" name="imageId" value={img.id} />
                      <input type="hidden" name="productId" value={productId} />
                      <button type="submit" className="rad-btn rad-dng rad-sm">
                        {dict.imagesRemove}
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form action={action} className="space-y-3 border-t pt-4" style={{ borderColor: "var(--rad-bd)" }}>
        <input type="hidden" name="productId" value={productId} />
        <SuggestEnAltPair
          arLabel={dict.imagesAltAr}
          enLabel={dict.imagesAltEn}
          labels={translate}
        />
        <div
          role="button"
          tabIndex={0}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed px-4 py-8 text-center transition-[border-color,background-color]",
            dragging && "border-[color:var(--rad-ac)]"
          )}
          style={{
            borderColor: dragging ? "var(--rad-ac)" : "var(--rad-bd2)",
            background: dragging ? "var(--rad-acs)" : "var(--rad-surface3)",
          }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (!file || !inputRef.current) return;
            const dt = new DataTransfer();
            dt.items.add(file);
            inputRef.current.files = dt.files;
            setFileName(file.name);
          }}
        >
          <ImagePlus
            width={28}
            height={28}
            strokeWidth={1.5}
            style={{ color: "var(--rad-tx3)" }}
            aria-hidden
          />
          <p className="text-sm font-medium" style={{ color: "var(--rad-tx)" }}>
            {ar
              ? "اسحب الملف هنا أو اختر من الجهاز"
              : "Drop a file here or choose from device"}
          </p>
          <p className="text-xs" style={{ color: "var(--rad-tx3)" }}>
            {fileName ? (
              <bdi dir="ltr">{fileName}</bdi>
            ) : (
              dict.imagesFileLabel
            )}
          </p>
          <span className="rad-btn rad-gh rad-sm mt-1 pointer-events-none">
            {ar ? "اختيار ملف" : "Choose file"}
          </span>
          <input
            ref={inputRef}
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,audio/mpeg,audio/ogg"
            required
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFileName(f?.name ?? null);
            }}
          />
        </div>
        <button
          type="submit"
          className="rad-btn rad-pri rad-sm"
          disabled={pending}
        >
          {pending ? dict.imagesUploading : dict.imagesAdd}
        </button>
        {state && !state.ok ? (
          <p className="text-sm" style={{ color: "var(--rad-err)" }} role="alert">
            {errorLabel(dict, state.error)}
          </p>
        ) : null}
      </form>
    </div>
  );

  if (bare) return body;

  return (
    <section
      className="space-y-4 rounded-[14px] border p-4 sm:p-5"
      style={{
        borderColor: "var(--rad-bd)",
        background: "var(--rad-surface)",
      }}
    >
      {body}
    </section>
  );
}
