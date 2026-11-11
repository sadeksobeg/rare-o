"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import {
  classifyMicError,
  micErrorMessage,
} from "@/lib/whatsapp/messaging/mic-errors";

function pickMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "audio/ogg;codecs=opus",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VoiceRecorder({
  ib,
  disabled,
  onRecorded,
  onActiveChange,
}: {
  ib: Dictionary["ib"];
  disabled?: boolean;
  onRecorded: (file: File, durationSec: number) => void;
  /** True while recording or previewing — parent hides the rest of the composer row. */
  onActiveChange?: (active: boolean) => void;
}) {
  const supported = typeof window !== "undefined" && pickMime() !== null;
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [mime, setMime] = useState<string>("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<number | null>(null);
  const startedAt = useRef(0);
  const cancelledRef = useRef(false);
  const analRef = useRef<{ ctx: AudioContext; raf: number } | null>(null);
  const sendAfterStop = useRef(false);

  useEffect(() => {
    setMime(pickMime() ?? "");
    return () => {
      stopTracks();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onActiveChange?.(recording || Boolean(previewBlob));
  }, [recording, previewBlob, onActiveChange]);

  function stopMeter() {
    if (analRef.current) {
      cancelAnimationFrame(analRef.current.raf);
      void analRef.current.ctx.close().catch(() => undefined);
      analRef.current = null;
    }
    setLevel(0);
  }

  function stopTracks() {
    stopMeter();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewBlob(null);
    setElapsed(0);
    setInlineError(null);
  }

  function startMeter(stream: MediaStream) {
    try {
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const anal = ctx.createAnalyser();
      anal.fftSize = 256;
      src.connect(anal);
      const data = new Uint8Array(anal.frequencyBinCount);
      const tick = () => {
        anal.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i]!;
        setLevel(Math.min(1, sum / (data.length * 180)));
        if (analRef.current) {
          analRef.current.raf = requestAnimationFrame(tick);
        }
      };
      analRef.current = { ctx, raf: requestAnimationFrame(tick) };
    } catch {
      /* meter optional */
    }
  }

  function emitFile(blob: Blob, durationSec: number) {
    const ext = blob.type.includes("ogg")
      ? "ogg"
      : blob.type.includes("mp4")
        ? "m4a"
        : "webm";
    const file = new File([blob], `voice-${Date.now()}.${ext}`, {
      type: blob.type || "audio/webm",
    });
    onRecorded(file, Math.max(1, durationSec));
  }

  async function start() {
    if (disabled || recording) return;
    clearPreview();
    setInlineError(null);
    if (!supported || typeof MediaRecorder === "undefined") {
      const msg = micErrorMessage("unsupported", ib);
      setInlineError(msg);
      toast.error(msg);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startMeter(stream);
      const options = mime ? { mimeType: mime } : undefined;
      const rec = new MediaRecorder(stream, options);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stopTracks();
        if (tickRef.current) {
          window.clearInterval(tickRef.current);
          tickRef.current = null;
        }
        setRecording(false);
        const durationSec = Math.max(
          1,
          Math.floor((Date.now() - startedAt.current) / 1000)
        );
        if (cancelledRef.current) {
          cancelledRef.current = false;
          sendAfterStop.current = false;
          chunksRef.current = [];
          return;
        }
        const type = rec.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        if (sendAfterStop.current) {
          sendAfterStop.current = false;
          emitFile(blob, durationSec);
          clearPreview();
          return;
        }
        const url = URL.createObjectURL(blob);
        setPreviewBlob(blob);
        setPreviewUrl(url);
        setElapsed(durationSec);
      };
      mediaRef.current = rec;
      cancelledRef.current = false;
      sendAfterStop.current = false;
      startedAt.current = Date.now();
      setElapsed(0);
      tickRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
      }, 250);
      rec.start(200);
      setRecording(true);
    } catch (err) {
      const msg = micErrorMessage(classifyMicError(err), ib);
      setInlineError(msg);
      toast.error(msg);
      stopTracks();
      setRecording(false);
    }
  }

  function cancel() {
    cancelledRef.current = true;
    sendAfterStop.current = false;
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    } else {
      clearPreview();
      stopTracks();
      setRecording(false);
    }
    chunksRef.current = [];
    clearPreview();
  }

  function sendNow() {
    if (previewBlob) {
      emitFile(previewBlob, Math.max(1, elapsed));
      clearPreview();
      return;
    }
    if (recording && mediaRef.current) {
      sendAfterStop.current = true;
      cancelledRef.current = false;
      if (mediaRef.current.state !== "inactive") mediaRef.current.stop();
    }
  }

  const cancelLabel = ib.voiceCancel.includes(" ")
    ? ib.voiceCancel.split(/\s+/)[0]!
    : ib.voiceCancel;
  const sendLabel = ib.voiceSend.includes(" ")
    ? ib.voiceSend.split(/\s+/).slice(0, 1).join(" ")
    : ib.voiceSend;

  if (previewUrl && previewBlob) {
    return (
      <div
        className="rad-voice rad-voice-bar rad-voice-preview"
        data-voice-recorder="preview"
      >
        <audio src={previewUrl} controls />
        <span className="rad-voice-timer">{formatSec(elapsed)}</span>
        <span className="sp" />
        <button
          type="button"
          className="rad-btn rad-gh"
          aria-label={ib.voiceCancel}
          onClick={cancel}
        >
          <Trash2 width={16} height={16} strokeWidth={1.5} aria-hidden />
          <span className="rad-voice-btn-label">{cancelLabel}</span>
        </button>
        <button
          type="button"
          className="rad-btn rad-pri rad-voice-send"
          aria-label={ib.voiceSend}
          onClick={sendNow}
        >
          <Send width={16} height={16} strokeWidth={1.5} aria-hidden />
          <span className="rad-voice-btn-label">{sendLabel}</span>
        </button>
      </div>
    );
  }

  if (recording) {
    return (
      <div
        className="rad-voice rad-voice-bar rad-on"
        data-voice-recorder="recording"
      >
        <span className="rad-voice-dot" aria-hidden />
        <span className="rad-voice-timer">{formatSec(elapsed)}</span>
        <span
          className="rad-voice-level"
          aria-hidden
          style={{ ["--rad-voice-level" as string]: String(Math.max(level, 0.08)) }}
        />
        <span className="rad-voice-label">{ib.voiceRecording}</span>
        <span className="sp" />
        <button
          type="button"
          className="rad-btn rad-gh"
          aria-label={ib.voiceCancel}
          onClick={cancel}
        >
          <Trash2 width={16} height={16} strokeWidth={1.5} aria-hidden />
          <span className="rad-voice-btn-label">{cancelLabel}</span>
        </button>
        <button
          type="button"
          className="rad-btn rad-pri rad-voice-send"
          aria-label={ib.voiceSend}
          onClick={sendNow}
        >
          <Send width={16} height={16} strokeWidth={1.5} aria-hidden />
          <span className="rad-voice-btn-label">{sendLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rad-voice" data-voice-recorder="idle">
      <button
        type="button"
        className="rad-ib"
        aria-label={ib.voiceRecord}
        disabled={disabled}
        onClick={() => void start()}
      >
        <Mic width={18} height={18} strokeWidth={1.5} aria-hidden />
      </button>
      {inlineError ? (
        <span className="rad-voice-err" role="alert">
          {inlineError}
        </span>
      ) : null}
    </div>
  );
}
