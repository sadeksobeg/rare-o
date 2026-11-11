"use client";

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { FixedMenu } from "@/components/admin/rad/inbox/fixed-menu";

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
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (
        t instanceof Element &&
        t.closest(".rad-fixed-menu, .rad-emoji-panel")
      ) {
        return;
      }
      setOpen(false);
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
    <div className="rad-emoji">
      <button
        ref={btnRef}
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
      <FixedMenu
        open={open}
        anchorRef={btnRef}
        placement="above-start"
        variant="panel"
        width={320}
        maxHeight={280}
        className="rad-emoji-panel"
        role="dialog"
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
      </FixedMenu>
    </div>
  );
}
