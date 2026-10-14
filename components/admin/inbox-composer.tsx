"use client";

import { adminSendWhatsAppTextAction } from "@/app/whatsapp-actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { MAX_OUTBOUND_TEXT_LENGTH } from "@/lib/whatsapp/messaging/constants";
import { ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

/**
 * A15 — Composer: Enter sends, Shift+Enter newline, length near limit,
 * disabled reasons from dictionary, duplicate-submit guard via clientRequestId.
 */
export function InboxComposer({
  conversationId,
  outboundEnabled,
  connectionState,
  dict,
}: {
  conversationId: string;
  outboundEnabled: boolean;
  connectionState: string;
  dict: Dictionary;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const clientRequestIdRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const router = useRouter();
  const i = dict.inbox;
  const nearLimit = text.length >= MAX_OUTBOUND_TEXT_LENGTH - 200;

  function disabledReason(): string | null {
    if (
      connectionState === "DISCONNECTED" ||
      connectionState === "ERROR" ||
      connectionState === "AUTHENTICATION_REQUIRED" ||
      connectionState === "CONNECTING" ||
      connectionState === "RECONNECTING"
    ) {
      return i.disconnected;
    }
    if (!outboundEnabled) return i.sendingPaused;
    return null;
  }

  const blockReason = disabledReason();

  function ensureClientRequestId(): string {
    if (!clientRequestIdRef.current) {
      clientRequestIdRef.current =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `out-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
    return clientRequestIdRef.current;
  }

  function submit() {
    if (blockReason || pending || submittingRef.current) return;
    const body = text.trim();
    if (!body) return;
    submittingRef.current = true;
    const fd = new FormData();
    fd.set("conversationId", conversationId);
    fd.set("text", body);
    fd.set("clientRequestId", ensureClientRequestId());
    startTransition(async () => {
      setError(null);
      try {
        const res = await adminSendWhatsAppTextAction(fd);
        if (!res.ok) {
          if (res.error === "OUTBOUND_DISABLED") setError(i.sendingPaused);
          else if (res.error === "RATE_LIMITED") setError(i.rateLimited);
          else setError(i.sendFailed);
          return;
        }
        setText("");
        clientRequestIdRef.current = null;
        router.refresh();
      } finally {
        submittingRef.current = false;
      }
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  if (blockReason) {
    return (
      <div
        data-inbox-composer="disabled"
        className="rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-sunken px-4 py-3 text-sm text-ro-plum"
      >
        {blockReason}
      </div>
    );
  }

  return (
    <form
      data-inbox-composer="ready"
      className="space-y-2 border border-ro-border bg-ro-paper p-3"
      onSubmit={onSubmit}
    >
      <label className="block">
        <span className="sr-only">{i.replyPlaceholder}</span>
        <textarea
          name="text"
          rows={2}
          value={text}
          onChange={(e) =>
            setText(e.target.value.slice(0, MAX_OUTBOUND_TEXT_LENGTH))
          }
          onKeyDown={onKeyDown}
          placeholder={i.replyPlaceholder}
          className="max-h-[9rem] min-h-[2.75rem] w-full resize-y rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-canvas px-3 py-2 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
          disabled={pending}
          aria-describedby={nearLimit ? "inbox-len" : undefined}
        />
      </label>
      <div className="flex items-center justify-between gap-3">
        <p
          id="inbox-len"
          className={cn(
            "text-xs",
            nearLimit ? "font-medium text-ro-plum" : "text-ro-muted"
          )}
        >
          {nearLimit
            ? `${i.lengthNearLimit} · ${text.length}/${MAX_OUTBOUND_TEXT_LENGTH}`
            : `${text.length}/${MAX_OUTBOUND_TEXT_LENGTH}`}
        </p>
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="inline-flex size-10 items-center justify-center bg-[var(--ro-plum-900)] text-[var(--ro-sand-100)] disabled:opacity-45"
          aria-label={pending ? i.sending : i.send}
        >
          <ArrowUp className="size-4 rtl:rotate-180" aria-hidden />
        </button>
      </div>
      {error ? (
        <p className="text-sm text-[var(--ro-danger-700)]" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
