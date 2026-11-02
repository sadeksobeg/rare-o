"use client";

import {
  adminSendWhatsAppMediaAction,
  adminSendWhatsAppTextAction,
} from "@/app/whatsapp-actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { MAX_OUTBOUND_TEXT_LENGTH } from "@/lib/whatsapp/messaging/constants";
import { WHATSAPP_OUTBOUND_MIME } from "@/lib/whatsapp/media-shared";
import { ArrowUp, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

/**
 * A15 — Composer: text + optional media attach.
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
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const clientRequestIdRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const router = useRouter();
  const i = dict.inbox;
  const nearLimit = text.length >= MAX_OUTBOUND_TEXT_LENGTH - 200;
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const sync = () => {
      const inset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop
      );
      setKeyboardInset(inset);
    };
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    sync();
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
    };
  }, []);

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
    if (file) {
      submittingRef.current = true;
      const fd = new FormData();
      fd.set("conversationId", conversationId);
      fd.set("clientRequestId", ensureClientRequestId());
      fd.set("file", file);
      if (caption.trim()) fd.set("caption", caption.trim());
      startTransition(async () => {
        setError(null);
        try {
          const res = await adminSendWhatsAppMediaAction(fd);
          if (!res.ok) {
            if (res.error === "OUTBOUND_DISABLED") setError(i.sendingPaused);
            else if (res.error === "RATE_LIMITED") setError(i.rateLimited);
            else setError(i.sendFailed);
            return;
          }
          setFile(null);
          setCaption("");
          if (fileRef.current) fileRef.current.value = "";
          clientRequestIdRef.current = null;
          router.refresh();
        } finally {
          submittingRef.current = false;
        }
      });
      return;
    }

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

  const quickReplies = [
    i.quickReplyGreeting,
    i.quickReplyFollowUp,
    i.quickReplyThanks,
  ];
  const accept = Object.keys(WHATSAPP_OUTBOUND_MIME).join(",");
  const canSend = file ? true : !!text.trim();

  return (
    <form
      data-inbox-composer="ready"
      className="space-y-2 border border-ro-border bg-ro-paper p-3"
      style={keyboardInset ? { marginBottom: keyboardInset } : undefined}
      onSubmit={onSubmit}
    >
      <div className="flex flex-wrap gap-1.5" aria-label={i.quickRepliesLabel}>
        {quickReplies.map((reply) => (
          <button
            key={reply}
            type="button"
            disabled={pending || !!file}
            onClick={() =>
              setText(reply.slice(0, MAX_OUTBOUND_TEXT_LENGTH))
            }
            className="max-w-full truncate rounded-[var(--ro-r-sm)] border border-[color-mix(in_srgb,var(--ro-plum-900)_22%,transparent)] bg-[color-mix(in_srgb,var(--ro-sand-50)_90%,var(--ro-plum-50))] px-2.5 py-1.5 text-xs font-medium text-[var(--ro-plum-900)] transition-opacity hover:opacity-90"
          >
            {reply}
          </button>
        ))}
      </div>

      {file ? (
        <div className="space-y-2 rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-sunken px-3 py-2 text-sm">
          <p className="font-medium text-ro-ink">
            <bdi>{file.name}</bdi>
          </p>
          <label className="block">
            <span className="mb-1 block text-xs text-ro-muted">{i.attachCaption}</span>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 1024))}
              className="w-full rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-canvas px-3 py-2 text-sm"
              disabled={pending}
            />
          </label>
          <button
            type="button"
            className="text-xs font-semibold text-ro-plum underline-offset-2 hover:underline"
            onClick={() => {
              setFile(null);
              setCaption("");
              if (fileRef.current) fileRef.current.value = "";
            }}
          >
            {dict.common.cancel}
          </button>
        </div>
      ) : (
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
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => {
              const next = e.target.files?.[0] ?? null;
              if (next && !WHATSAPP_OUTBOUND_MIME[next.type]) {
                setError(i.sendFailed);
                e.target.value = "";
                return;
              }
              setError(null);
              setFile(next);
            }}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
            className="inline-flex size-10 items-center justify-center border border-ro-border text-ro-ink disabled:opacity-45"
            aria-label={i.attachFile}
          >
            <Paperclip className="size-4" strokeWidth={1.5} aria-hidden />
          </button>
          {!file ? (
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
          ) : null}
        </div>
        <button
          type="submit"
          disabled={pending || !canSend}
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
