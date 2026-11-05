"use client";

import Image from "next/image";
import { useActionState, useRef } from "react";
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
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";

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
}: {
  productId: string;
  images: MediaRow[];
  dict: Dictionary["admin"];
  translate: SuggestEnLabels;
}) {
  const [state, action, pending] = useActionState(
    attachProductImageAction,
    initial
  );
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="ro-portal-card space-y-4 border p-4 sm:p-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-ro-ink">
          {dict.imagesTitle}
        </h2>
        <p className="mt-1 text-xs text-ro-muted">{dict.imagesLimits}</p>
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-ro-muted">{dict.imagesEmpty}</p>
      ) : (
        <ul className="space-y-4">
          {images.map((img, index) => {
            const isVideo = img.kind === "video";
            const isAudio = img.kind === "audio";
            return (
              <li
                key={img.id}
                className="flex flex-col gap-3 border border-ro-line p-3 sm:flex-row"
              >
                {isAudio ? (
                  <div className="relative flex w-full shrink-0 items-center gap-2 bg-ro-sunken p-2.5 sm:w-56">
                    {index === 0 ? (
                      <span className="absolute start-1 top-1 bg-ro-ink px-1.5 py-0.5 text-[10px] text-ro-canvas">
                        {dict.imagesPrimary}
                      </span>
                    ) : null}
                    <span className="shrink-0 bg-[var(--ro-plum-900)] px-1.5 py-0.5 text-[10px] text-[var(--ro-sand-50)]">
                      {dict.imagesKindAudio}
                    </span>
                    <audio
                      src={img.path}
                      controls
                      preload="metadata"
                      className="h-9 min-w-0 flex-1"
                    />
                  </div>
                ) : (
                  <div className="relative size-24 shrink-0 overflow-hidden bg-ro-sunken">
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
                      <span className="absolute start-1 top-1 bg-ro-ink px-1.5 py-0.5 text-[10px] text-ro-canvas">
                        {dict.imagesPrimary}
                      </span>
                    ) : null}
                    {isVideo ? (
                      <span className="absolute end-1 bottom-1 bg-[var(--ro-plum-900)] px-1.5 py-0.5 text-[10px] text-[var(--ro-sand-50)]">
                        {dict.imagesKindVideo}
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
                    <Button type="submit" variant="quiet" size="sm">
                      {dict.edit}
                    </Button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    <form action={reorderProductImageAction}>
                      <input type="hidden" name="imageId" value={img.id} />
                      <input type="hidden" name="productId" value={productId} />
                      <input type="hidden" name="direction" value="earlier" />
                      <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        disabled={index === 0}
                        aria-label={dict.imagesMoveEarlier}
                      >
                        ↑
                      </Button>
                    </form>
                    <form action={reorderProductImageAction}>
                      <input type="hidden" name="imageId" value={img.id} />
                      <input type="hidden" name="productId" value={productId} />
                      <input type="hidden" name="direction" value="later" />
                      <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        disabled={index === images.length - 1}
                        aria-label={dict.imagesMoveLater}
                      >
                        ↓
                      </Button>
                    </form>
                    <form action={removeProductImageAction}>
                      <input type="hidden" name="imageId" value={img.id} />
                      <input type="hidden" name="productId" value={productId} />
                      <Button type="submit" variant="danger" size="sm">
                        {dict.imagesRemove}
                      </Button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form action={action} className="space-y-3 border-t border-ro-line pt-4">
        <input type="hidden" name="productId" value={productId} />
        <SuggestEnAltPair
          arLabel={dict.imagesAltAr}
          enLabel={dict.imagesAltEn}
          labels={translate}
        />
        <label className="block space-y-1 text-sm">
          <span className="font-medium">{dict.imagesFileLabel}</span>
          <input
            ref={inputRef}
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,audio/mpeg,audio/ogg"
            required
            className="mt-1 block w-full text-sm"
          />
        </label>
        <Button type="submit" variant="primary" size="sm" loading={pending}>
          {pending ? dict.imagesUploading : dict.imagesAdd}
        </Button>
        {state && !state.ok ? (
          <p className="text-sm text-[var(--ro-danger-700)]">
            {errorLabel(dict, state.error)}
          </p>
        ) : null}
      </form>
    </section>
  );
}
