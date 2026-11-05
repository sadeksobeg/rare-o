"use client";

import {
  adminSendWhatsAppMediaAction,
  adminSendWhatsAppTextAction,
} from "@/app/whatsapp-actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { MAX_OUTBOUND_TEXT_LENGTH } from "@/lib/whatsapp/messaging/constants";
import {
  normalizeOutboundMime,
  WHATSAPP_OUTBOUND_MIME,
} from "@/lib/whatsapp/media-shared";
import { ArrowUp, Mic, Paperclip, Square, X } from "lucide-react";
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

function pickRecorderMime(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const candidates = [
    "audio/ogg;codecs=opus",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "audio/webm";
}

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const WAVEFORM_BARS = 28;

/**
 * Live mic-level waveform while recording. Reads the analyser on every
 * animation frame and writes straight to each bar's transform via refs —
 * React never re-renders for this, only `transform`/`opacity` change (per
 * the motion rules: no `transition: all`, no layout-affecting properties).
 * Falls back to a static bar row when the OS/browser asks for reduced motion.
 */
function RecordingWaveform({ stream }: { stream: MediaStream | null }) {
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || typeof AudioContext === "undefined") return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const step = Math.floor(data.length / WAVEFORM_BARS) || 1;
      for (let i = 0; i < WAVEFORM_BARS; i++) {
        const v = data[i * step] ?? 0;
        const scale = Math.max(0.12, Math.min(1, v / 180));
        const bar = barRefs.current[i];
        if (bar) bar.style.transform = `scaleY(${scale})`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      source.disconnect();
      void ctx.close();
    };
  }, [stream]);

  return (
    <div
      className="flex h-6 flex-1 items-center gap-[2.5px] overflow-hidden"
      aria-hidden
    >
      {Array.from({ length: WAVEFORM_BARS }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          className="h-full w-[2.5px] shrink-0 origin-center rounded-full bg-[color:var(--ro-danger-700)] opacity-70 motion-reduce:opacity-40"
          style={{ transform: "scaleY(0.12)" }}
        />
      ))}
    </div>
  );
}

/**
 * A15 — Composer: compact bar + quick replies + voice note (ptt audio).
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
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(
    null
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const clientRequestIdRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<number | null>(null);
  const router = useRouter();
  const i = dict.inbox;
  const nearLimit = text.length >= MAX_OUTBOUND_TEXT_LENGTH - 200;
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [micSupported, setMicSupported] = useState(false);

  useEffect(() => {
    setMicSupported(
      typeof MediaRecorder !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia
    );
  }, []);

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

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  useEffect(() => {
    return () => {
      stopTicker();
      teardownRecorder(true);
    };
  }, []);

  function stopTicker() {
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  function teardownRecorder(discard: boolean) {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      try {
        if (discard) rec.ondataavailable = null;
        rec.stop();
      } catch {
        /* ignore */
      }
    }
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecordingStream(null);
    if (discard) chunksRef.current = [];
  }

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

  function sendMediaFile(next: File, nextCaption?: string) {
    if (blockReason || pending || submittingRef.current) return;
    submittingRef.current = true;
    const fd = new FormData();
    fd.set("conversationId", conversationId);
    fd.set("clientRequestId", ensureClientRequestId());
    fd.set("file", next);
    if (nextCaption?.trim()) fd.set("caption", nextCaption.trim());
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
  }

  function submit() {
    if (blockReason || pending || submittingRef.current || recording) return;
    if (file) {
      sendMediaFile(file, caption);
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

  async function startRecording() {
    if (blockReason || pending || recording || file) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError(i.voiceDenied);
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setRecordingStream(stream);
      const mime = pickRecorderMime();
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        /* handled by stopRecording / cancel */
      };
      mediaRecorderRef.current = rec;
      rec.start(250);
      setElapsed(0);
      setRecording(true);
      stopTicker();
      tickRef.current = window.setInterval(() => {
        setElapsed((n) => n + 1);
      }, 1000);
    } catch {
      teardownRecorder(true);
      setRecording(false);
      setError(i.voiceDenied);
    }
  }

  function cancelRecording() {
    stopTicker();
    teardownRecorder(true);
    setRecording(false);
    setElapsed(0);
  }

  function stopAndSendRecording() {
    const rec = mediaRecorderRef.current;
    if (!rec || rec.state === "inactive") {
      cancelRecording();
      return;
    }
    stopTicker();
    const mimeType = rec.mimeType || pickRecorderMime();
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: normalizeOutboundMime(mimeType),
      });
      chunksRef.current = [];
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setRecordingStream(null);
      mediaRecorderRef.current = null;
      setRecording(false);
      setElapsed(0);
      if (blob.size < 1) {
        setError(i.sendFailed);
        return;
      }
      const base = normalizeOutboundMime(mimeType);
      const ext = WHATSAPP_OUTBOUND_MIME[base] || "webm";
      const voiceFile = new File([blob], `voice-${Date.now()}.${ext}`, {
        type: base,
      });
      sendMediaFile(voiceFile);
    };
    try {
      rec.stop();
    } catch {
      cancelRecording();
      setError(i.sendFailed);
    }
  }

  if (blockReason) {
    return (
      <div
        data-inbox-composer="disabled"
        className="rounded-[12px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-sunken)] px-3 py-2.5 text-xs font-medium text-[color:var(--ro-text-muted)]"
      >
        {blockReason}
      </div>
    );
  }

  const quickReplies = [
    { key: "g", full: i.quickReplyGreeting, short: i.quickReplyGreeting.slice(0, 18) },
    { key: "f", full: i.quickReplyFollowUp, short: i.quickReplyFollowUp.slice(0, 18) },
    { key: "t", full: i.quickReplyThanks, short: i.quickReplyThanks.slice(0, 18) },
  ];
  const accept = Object.keys(WHATSAPP_OUTBOUND_MIME).join(",");
  const canSend = file ? true : !!text.trim();

  return (
    <form
      data-inbox-composer="ready"
      className="space-y-2"
      style={keyboardInset ? { marginBottom: keyboardInset } : undefined}
      onSubmit={onSubmit}
    >
      {!recording && !file ? (
        <div
          className="flex gap-1.5 overflow-x-auto pb-0.5"
          aria-label={i.quickRepliesLabel}
        >
          {quickReplies.map((reply) => (
            <button
              key={reply.key}
              type="button"
              disabled={pending}
              title={reply.full}
              onClick={() =>
                setText(reply.full.slice(0, MAX_OUTBOUND_TEXT_LENGTH))
              }
              className="shrink-0 rounded-full border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-sunken)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--ro-text-2)] transition-[background-color] duration-[var(--ro-dur-fast)] hover:bg-[color:var(--ro-panel-hover)] disabled:opacity-50"
            >
              {reply.short}
              {reply.full.length > 18 ? "…" : ""}
            </button>
          ))}
        </div>
      ) : null}

      {file ? (
        <div className="flex items-start gap-2 rounded-[14px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-sunken)] p-2.5">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="truncate text-xs font-semibold text-[color:var(--ro-text)]">
              <bdi>{file.name}</bdi>
            </p>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 1024))}
              placeholder={i.attachCaption}
              className="w-full rounded-[10px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel)] px-2.5 py-1.5 text-xs outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
              disabled={pending}
            />
          </div>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-full text-[color:var(--ro-text-muted)] hover:bg-[color:var(--ro-panel-hover)]"
            aria-label={dict.common.cancel}
            onClick={() => {
              setFile(null);
              setCaption("");
              if (fileRef.current) fileRef.current.value = "";
            }}
          >
            <X className="size-3.5" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      ) : null}

      {recording ? (
        <div
          className="flex items-center gap-2.5 rounded-[16px] border border-[color:color-mix(in_srgb,var(--ro-danger-700)_35%,var(--ro-border-subtle))] bg-[color:var(--ro-bg-sunken)] px-3 py-2"
          role="status"
          aria-live="polite"
        >
          <span className="relative ms-0.5 flex size-2.5 shrink-0" aria-hidden>
            <span className="absolute inline-flex size-full rounded-full bg-[color:var(--ro-danger-700)] opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[color:var(--ro-danger-700)]" />
          </span>
          <p className="shrink-0 font-mono text-[12px] font-semibold tabular-nums text-[color:var(--ro-text)]">
            <bdi dir="ltr">{formatElapsed(elapsed)}</bdi>
          </p>
          <RecordingWaveform stream={recordingStream} />
          <p className="sr-only">{i.voiceRecording}</p>
          <button
            type="button"
            onClick={cancelRecording}
            className="inline-flex h-9 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-[color:var(--ro-text-muted)] hover:bg-[color:var(--ro-panel-hover)] hover:text-[color:var(--ro-text)]"
          >
            {i.voiceCancel}
          </button>
          <button
            type="button"
            onClick={stopAndSendRecording}
            disabled={pending || elapsed < 1}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--ro-plum-700)] text-[var(--ro-sand-50)] transition-[opacity,transform] duration-[var(--ro-dur-fast)] hover:opacity-90 active:scale-[0.96] disabled:opacity-40"
            aria-label={i.voiceStop}
          >
            <Square className="size-3.5 fill-current" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-1.5 rounded-[16px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-sunken)] p-1.5 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--ro-text)_4%,transparent)]">
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => {
              const next = e.target.files?.[0] ?? null;
              if (next && !WHATSAPP_OUTBOUND_MIME[normalizeOutboundMime(next.type)]) {
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
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[color:var(--ro-text-muted)] transition-[background-color,color] hover:bg-[color:var(--ro-panel-hover)] hover:text-[color:var(--ro-text)] disabled:opacity-45"
            aria-label={i.attachFile}
          >
            <Paperclip className="size-4" strokeWidth={1.5} aria-hidden />
          </button>

          {!file ? (
            <label className="min-w-0 flex-1">
              <span className="sr-only">{i.replyPlaceholder}</span>
              <textarea
                ref={taRef}
                name="text"
                rows={1}
                value={text}
                onChange={(e) =>
                  setText(e.target.value.slice(0, MAX_OUTBOUND_TEXT_LENGTH))
                }
                onKeyDown={onKeyDown}
                placeholder={i.replyPlaceholder}
                className="max-h-[7.5rem] min-h-[2.25rem] w-full resize-none bg-transparent px-1 py-2 text-sm leading-snug text-[color:var(--ro-text)] outline-none placeholder:text-[color:var(--ro-text-muted)]"
                disabled={pending}
                aria-describedby={nearLimit ? "inbox-len" : undefined}
              />
            </label>
          ) : (
            <p className="min-w-0 flex-1 px-1 py-2 text-xs text-[color:var(--ro-text-muted)]">
              {i.attachCaption}
            </p>
          )}

          <div className="flex shrink-0 items-end gap-0.5 pb-0.5">
            {!file && nearLimit ? (
              <p
                id="inbox-len"
                className="pe-1 pb-2 text-[10px] font-medium text-[color:var(--ro-accent-fg)]"
              >
                {text.length}/{MAX_OUTBOUND_TEXT_LENGTH}
              </p>
            ) : null}

            {micSupported && !file && !text.trim() ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => void startRecording()}
                className="inline-flex size-9 items-center justify-center rounded-full text-[color:var(--ro-text-muted)] transition-[background-color,color] hover:bg-[color:var(--ro-panel-hover)] hover:text-[color:var(--ro-accent-fg,var(--ro-plum-700))] disabled:opacity-45"
                aria-label={i.voiceRecord}
              >
                <Mic className="size-4" strokeWidth={1.5} aria-hidden />
              </button>
            ) : null}

            <button
              type="submit"
              disabled={pending || !canSend}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full transition-[opacity,transform] duration-[var(--ro-dur-fast)] disabled:opacity-40",
                canSend
                  ? "bg-[color:var(--ro-plum-700)] text-[var(--ro-sand-50)] hover:opacity-90 active:scale-[0.96]"
                  : "bg-[color:var(--ro-border-subtle)] text-[color:var(--ro-text-muted)]"
              )}
              aria-label={pending ? i.sending : i.send}
            >
              <ArrowUp
                className="size-4 rtl:rotate-180"
                strokeWidth={1.75}
                aria-hidden
              />
            </button>
          </div>
        </div>
      )}

      {error ? (
        <p
          className="text-xs font-medium text-[color:var(--ro-danger-700)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
