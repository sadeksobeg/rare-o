"use client";

import { useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { traderSendMessageAction } from "@/app/trader-portal-actions";
import { MAX_OUTBOUND_TEXT_LENGTH } from "@/lib/whatsapp/messaging/constants";
import type { TraderDict } from "@/lib/ui/trader-labels";
import { cn } from "@/lib/utils";

/**
 * Text-only by design (v1) — the goal is "keep talking if WhatsApp is
 * down," not full media parity with the admin's WhatsApp composer.
 */
export function TraderMessageComposer({ t }: { t: TraderDict }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const submittingRef = useRef(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  function errorLabel(code: string): string {
    switch (code) {
      case "EMPTY_TEXT":
        return t.messagesErrorEmpty;
      case "TEXT_TOO_LONG":
        return t.messagesErrorTooLong;
      case "RATE_LIMITED":
        return t.messagesErrorRateLimited;
      default:
        return t.messagesErrorGeneric;
    }
  }

  function submit() {
    const body = text.trim();
    if (!body || pending || submittingRef.current) return;
    submittingRef.current = true;
    const fd = new FormData();
    fd.set("text", body);
    startTransition(async () => {
      setError(null);
      try {
        const res = await traderSendMessageAction(null, fd);
        if (!res.ok) {
          setError(errorLabel(res.error ?? ""));
          return;
        }
        setText("");
        taRef.current?.focus();
      } finally {
        submittingRef.current = false;
      }
    });
  }

  return (
    <form
      className="space-y-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex items-end gap-1.5 rounded-[16px] border border-ro-border bg-ro-sunken p-1.5">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{t.messagesPlaceholder}</span>
          <textarea
            ref={taRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_OUTBOUND_TEXT_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={t.messagesPlaceholder}
            disabled={pending}
            className="max-h-[7.5rem] min-h-[2.25rem] w-full resize-none bg-transparent px-2 py-2 text-sm leading-snug text-ro-ink outline-none placeholder:text-ro-muted"
          />
        </label>
        <button
          type="submit"
          disabled={pending || !text.trim()}
          aria-label={pending ? t.messagesSending : t.messagesSend}
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-[opacity,transform] duration-150 disabled:opacity-40",
            text.trim()
              ? "bg-[var(--ro-plum-700)] text-[#fffcf8] hover:opacity-90 active:scale-[0.96]"
              : "bg-ro-border text-ro-muted"
          )}
        >
          <Send
            className="size-4 rtl:-scale-x-100"
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
      </div>
      {error ? (
        <p className="text-xs font-medium text-[color:var(--ro-danger-700)]" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
