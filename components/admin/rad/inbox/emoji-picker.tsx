"use client";

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

/** Compact, RTL-safe set — no remote CDN, no skin-tone panel. */
const EMOJIS = [
  "🙂",
  "😊",
  "🙏",
  "👍",
  "👌",
  "✨",
  "🌹",
  "✅",
  "❗",
  "❓",
  "📦",
  "📝",
  "💰",
  "🕐",
  "📍",
  "❤️",
  "🤍",
  "🎉",
  "👋",
  "🤝",
] as const;

export function EmojiPicker({
  ib,
  disabled,
  onPick,
}: {
  ib: Dictionary["ib"];
  disabled?: boolean;
  onPick: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="rad-emoji" ref={rootRef}>
      <button
        type="button"
        className="rad-ib"
        data-tip={ib.emojiPickerLabel}
        aria-label={ib.emojiPickerLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <Smile width={18} height={18} strokeWidth={1.5} aria-hidden />
      </button>
      <div
        className={cn("rad-emoji-panel", open && "rad-on")}
        role="dialog"
        aria-label={ib.emojiPickerLabel}
        hidden={!open}
      >
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="rad-emoji-btn"
            onClick={() => {
              onPick(emoji);
              setOpen(false);
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
