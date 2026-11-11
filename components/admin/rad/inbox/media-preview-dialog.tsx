"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  mediaKindFromMime,
  maxBytesForMediaKind,
  normalizeOutboundMime,
  WHATSAPP_OUTBOUND_MIME,
} from "@/lib/whatsapp/media-shared";

export type PendingMedia = {
  file: File;
  objectUrl: string;
};

export function validateOutboundMedia(
  file: File,
  ib: Dictionary["ib"]
): { ok: true } | { ok: false; error: string } {
  const mime = normalizeOutboundMime(file.type || "");
  if (!WHATSAPP_OUTBOUND_MIME[mime]) {
    return { ok: false, error: ib.mediaBadType };
  }
  const kind = mediaKindFromMime(mime);
  if (!kind || kind === "sticker") {
    return { ok: false, error: ib.mediaBadType };
  }
  if (file.size > maxBytesForMediaKind(kind)) {
    return { ok: false, error: ib.mediaTooLarge };
  }
  return { ok: true };
}

export function MediaPreviewDialog({
  pending,
  ib,
  sending,
  onCancel,
  onSend,
}: {
  pending: PendingMedia | null;
  ib: Dictionary["ib"];
  sending: boolean;
  onCancel: () => void;
  onSend: (caption: string) => void;
}) {
  const [caption, setCaption] = useState("");

  useEffect(() => {
    setCaption("");
  }, [pending?.objectUrl]);

  const kind = useMemo(() => {
    if (!pending) return null;
    return mediaKindFromMime(pending.file.type || "");
  }, [pending]);

  return (
    <Dialog
      open={Boolean(pending)}
      onClose={() => {
        if (!sending) onCancel();
      }}
      title={ib.mediaPreviewTitle}
      size="md"
      preventDismiss={sending}
    >
      {pending ? (
        <div className="rad-mpv">
          <div className="rad-mpv-stage">
            {kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pending.objectUrl} alt={pending.file.name} />
            ) : kind === "video" ? (
              <video src={pending.objectUrl} controls playsInline />
            ) : kind === "audio" ? (
              <audio src={pending.objectUrl} controls />
            ) : (
              <div className="rad-mpv-doc">
                <b>
                  <bdi dir="ltr">{pending.file.name}</bdi>
                </b>
                <span>
                  <bdi dir="ltr">{Math.round(pending.file.size / 1024)} KB</bdi>
                </span>
              </div>
            )}
          </div>
          <label className="rad-mpv-cap">
            <span className="sr-only">{ib.mediaCaptionPlaceholder}</span>
            <textarea
              rows={2}
              value={caption}
              disabled={sending}
              placeholder={ib.mediaCaptionPlaceholder}
              onChange={(e) => setCaption(e.target.value)}
            />
          </label>
          <div className="rad-mpv-acts">
            <button
              type="button"
              className="rad-btn rad-gh"
              disabled={sending}
              onClick={onCancel}
            >
              {ib.mediaCancel}
            </button>
            <button
              type="button"
              className="rad-btn rad-pri"
              disabled={sending}
              onClick={() => onSend(caption.trim())}
            >
              {sending ? "…" : ib.mediaSend}
            </button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
