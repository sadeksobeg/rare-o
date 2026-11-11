"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  MapPin,
  UserRound,
  X,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { InboxMessageItem } from "@/lib/whatsapp/messaging/inbox";
import { Dialog } from "@/components/ui/dialog";
import { InboxAudioPlayer } from "@/components/admin/rad/inbox/audio-player";

function formatBytes(n: number | null, ib: Dictionary["ib"]): string | null {
  if (n == null || !Number.isFinite(n) || n <= 0) return null;
  if (n < 1024) return ib.docSize.replace("{size}", `${n} B`);
  if (n < 1024 * 1024) {
    return ib.docSize.replace("{size}", `${Math.round(n / 1024)} KB`);
  }
  return ib.docSize.replace(
    "{size}",
    `${(n / (1024 * 1024)).toFixed(1)} MB`
  );
}

function formatDuration(sec: number | null, ib: Dictionary["ib"]): string | null {
  if (sec == null || !Number.isFinite(sec) || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return ib.mediaDuration.replace(
    "{time}",
    `${m}:${String(s).padStart(2, "0")}`
  );
}

type LocPayload = {
  lat?: number | null;
  lng?: number | null;
  name?: string | null;
  address?: string | null;
};

type ContactPayload = {
  displayName?: string | null;
  vcard?: string | null;
  contacts?: { displayName?: string | null }[];
};

function parseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function MediaBubbleBody({
  m,
  ib,
}: {
  m: InboxMessageItem;
  ib: Dictionary["ib"];
}) {
  const [lightbox, setLightbox] = useState(false);
  const type = (m.messageType || "").toLowerCase();
  const sizeLabel = formatBytes(m.mediaSize, ib);
  const durLabel = formatDuration(m.mediaDurationSec, ib);

  if (type === "image" || type === "sticker") {
    if (!m.mediaUrl && !m.thumbnailUrl) {
      return <span>{ib.previewImage}</span>;
    }
    const src = m.mediaUrl || m.thumbnailUrl!;
    return (
      <>
        <button
          type="button"
          className="rad-media-img"
          onClick={() => m.mediaUrl && setLightbox(true)}
          aria-label={ib.previewImage}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={m.thumbnailUrl || src}
            alt={m.caption || m.mediaFileName || ib.previewImage}
            loading="lazy"
          />
        </button>
        {m.caption ? <div className="rad-media-cap">{m.caption}</div> : null}
        {lightbox && m.mediaUrl ? (
          <Dialog
            open={lightbox}
            onClose={() => setLightbox(false)}
            title={ib.previewImage}
            size="lg"
            hideHeader
          >
            <div className="rad-lightbox">
              <button
                type="button"
                className="rad-ib rad-lightbox-x"
                aria-label={ib.lightboxClose}
                onClick={() => setLightbox(false)}
              >
                <X width={18} height={18} strokeWidth={1.5} aria-hidden />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.mediaUrl} alt={m.caption || ib.previewImage} />
              {m.mediaUrl ? (
                <a
                  className="rad-btn rad-gh"
                  href={m.mediaUrl}
                  download={m.mediaFileName || true}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download width={14} height={14} strokeWidth={1.5} aria-hidden />
                  {ib.downloadMedia}
                </a>
              ) : null}
            </div>
          </Dialog>
        ) : null}
      </>
    );
  }

  if (type === "video") {
    if (!m.mediaUrl) return <span>{ib.previewVideo}</span>;
    return (
      <div className="rad-media-video">
        <video src={m.mediaUrl} controls playsInline preload="metadata" />
        {m.caption ? <div className="rad-media-cap">{m.caption}</div> : null}
      </div>
    );
  }

  if (type === "audio" || type === "ptt" || type === "voice") {
    if (!m.mediaUrl) return <span>{ib.previewAudio}</span>;
    return (
      <div className="rad-media-audio">
        <InboxAudioPlayer
          src={m.mediaUrl}
          durationSec={m.mediaDurationSec}
          label={m.isPtt ? ib.previewAudio : null}
        />
        {durLabel && !m.mediaDurationSec ? (
          <span className="rad-media-meta">{durLabel}</span>
        ) : null}
      </div>
    );
  }

  if (type === "document" || type === "file") {
    return (
      <div className="rad-pc rad-media-doc">
        <div className="rad-im">
          <FileText width={22} height={22} strokeWidth={1.5} aria-hidden />
        </div>
        <div>
          <b>
            <bdi dir="ltr">{m.mediaFileName || ib.previewDocument}</bdi>
          </b>
          {sizeLabel ? (
            <span>
              <bdi dir="ltr">{sizeLabel}</bdi>
            </span>
          ) : null}
          {m.mediaUrl ? (
            <a href={m.mediaUrl} download={m.mediaFileName || true} target="_blank" rel="noreferrer">
              {ib.downloadMedia}
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  if (type === "location") {
    const loc = parseJson<LocPayload>(m.body);
    const lat = loc?.lat;
    const lng = loc?.lng;
    const label = loc?.name || loc?.address || ib.previewLocation;
    const mapHref =
      lat != null && lng != null
        ? `https://maps.google.com/?q=${encodeURIComponent(`${lat},${lng}`)}`
        : null;
    return (
      <div className="rad-pc rad-media-loc">
        <div className="rad-im">
          <MapPin width={22} height={22} strokeWidth={1.5} aria-hidden />
        </div>
        <div>
          <b>{label}</b>
          {mapHref ? (
            <a href={mapHref} target="_blank" rel="noreferrer">
              {ib.openMap}
            </a>
          ) : (
            <span>{ib.previewLocation}</span>
          )}
        </div>
      </div>
    );
  }

  if (type === "contact" || type === "contacts" || type === "vcard") {
    const c = parseJson<ContactPayload>(m.body);
    const name =
      c?.displayName ||
      c?.contacts?.[0]?.displayName ||
      m.body?.slice(0, 80) ||
      ib.previewContact;
    return (
      <div className="rad-pc rad-media-contact">
        <div className="rad-im">
          <UserRound width={22} height={22} strokeWidth={1.5} aria-hidden />
        </div>
        <div>
          <b>{name}</b>
          <span>{ib.previewContact}</span>
        </div>
      </div>
    );
  }

  return null;
}

export function isRenderableMediaType(messageType: string): boolean {
  const t = messageType.toLowerCase();
  return (
    t === "image" ||
    t === "sticker" ||
    t === "video" ||
    t === "audio" ||
    t === "ptt" ||
    t === "voice" ||
    t === "document" ||
    t === "file" ||
    t === "location" ||
    t === "contact" ||
    t === "contacts" ||
    t === "vcard"
  );
}
