"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, FileText, Image as ImageIcon, Paperclip } from "lucide-react";
import { toast } from "sonner";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { validateOutboundMedia } from "@/components/admin/rad/inbox/media-preview-dialog";
import { cn } from "@/lib/utils";

const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm";
const DOC_ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,image/gif";
const CAMERA_ACCEPT = "image/jpeg,image/png,image/webp";

export function AttachMenu({
  ib,
  disabled,
  onPick,
}: {
  ib: Dictionary["ib"];
  disabled?: boolean;
  onPick: (file: File) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleFiles(list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    const check = validateOutboundMedia(file, ib);
    if (!check.ok) {
      toast.error(check.error);
      return;
    }
    setOpen(false);
    onPick(file);
  }

  return (
    <div className="rad-attach" ref={rootRef}>
      <button
        type="button"
        className="rad-ib"
        data-tip={ib.attachLabel}
        aria-label={ib.attachLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <Paperclip width={18} height={18} strokeWidth={1.5} aria-hidden />
      </button>
      <div className={cn("rad-menu rad-attach-menu", open && "rad-on")} role="menu">
        <button
          type="button"
          role="menuitem"
          onClick={() => photoRef.current?.click()}
        >
          <ImageIcon width={16} height={16} strokeWidth={1.5} aria-hidden />
          {ib.attachPhotoVideo}
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => docRef.current?.click()}
        >
          <FileText width={16} height={16} strokeWidth={1.5} aria-hidden />
          {ib.attachDocument}
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => camRef.current?.click()}
        >
          <Camera width={16} height={16} strokeWidth={1.5} aria-hidden />
          {ib.attachCamera}
        </button>
      </div>
      <input
        ref={photoRef}
        type="file"
        accept={PHOTO_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={docRef}
        type="file"
        accept={DOC_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={camRef}
        type="file"
        accept={CAMERA_ACCEPT}
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
