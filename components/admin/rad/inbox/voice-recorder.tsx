"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

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
}: {
  ib: Dictionary["ib"];
  disabled?: boolean;
  onRecorded: (file: File, durationSec: number) => void;
}) {
  const supported = typeof window !== "undefined" && pickMime() !== null;
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [mime, setMime] = useState<string>("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<number | null>(null);
  const startedAt = useRef(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    setMime(pickMime() ?? "");
    return () => {
      stopTracks();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopTracks() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewBlob(null);
    setElapsed(0);
  }

  async function start() {
    if (disabled || recording) return;
    clearPreview();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
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
        if (cancelledRef.current) {
          cancelledRef.current = false;
          chunksRef.current = [];
          return;
        }
        const type = rec.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const url = URL.createObjectURL(blob);
        setPreviewBlob(blob);
        setPreviewUrl(url);
      };
      mediaRef.current = rec;
      cancelledRef.current = false;
      startedAt.current = Date.now();
      setElapsed(0);
      tickRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
      }, 250);
      rec.start(200);
      setRecording(true);
    } catch {
      toast.error(ib.voiceMicDenied);
      stopTracks();
      setRecording(false);
    }
  }

  function stop() {
    const rec = mediaRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }

  function send() {
    if (!previewBlob) return;
    const ext = previewBlob.type.includes("ogg")
      ? "ogg"
      : previewBlob.type.includes("mp4")
        ? "m4a"
        : "webm";
    const file = new File([previewBlob], `voice-${Date.now()}.${ext}`, {
      type: previewBlob.type || "audio/webm",
    });
    onRecorded(file, Math.max(1, elapsed));
    clearPreview();
  }

  if (!supported) return null;

  if (previewUrl && previewBlob) {
    return (
      <div className="rad-voice rad-voice-preview">
        <audio src={previewUrl} controls />
        <span className="rad-voice-timer">{formatSec(elapsed)}</span>
        <button
          type="button"
          className="rad-ib"
          aria-label={ib.voiceCancel}
          onClick={clearPreview}
        >
          <Trash2 width={16} height={16} strokeWidth={1.5} aria-hidden />
        </button>
        <button
          type="button"
          className="rad-ib rad-voice-send"
          aria-label={ib.voiceSend}
          onClick={send}
        >
          <Send width={16} height={16} strokeWidth={1.5} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("rad-voice", recording && "rad-on")}>
      {recording ? (
        <>
          <span className="rad-voice-dot" aria-hidden />
          <span className="rad-voice-timer">{formatSec(elapsed)}</span>
          <span className="rad-voice-label">{ib.voiceRecording}</span>
          <button
            type="button"
            className="rad-ib"
            aria-label={ib.voiceStop}
            onClick={stop}
          >
            <Square width={16} height={16} strokeWidth={1.5} aria-hidden />
          </button>
          <button
            type="button"
            className="rad-ib"
            aria-label={ib.voiceCancel}
            onClick={() => {
              cancelledRef.current = true;
              mediaRef.current?.stop();
              chunksRef.current = [];
              clearPreview();
              stopTracks();
              setRecording(false);
            }}
          >
            <Trash2 width={16} height={16} strokeWidth={1.5} aria-hidden />
          </button>
        </>
      ) : (
        <button
          type="button"
          className="rad-ib"
          data-tip={ib.voiceRecord}
          aria-label={ib.voiceRecord}
          disabled={disabled}
          onClick={start}
        >
          <Mic width={18} height={18} strokeWidth={1.5} aria-hidden />
        </button>
      )}
    </div>
  );
}
