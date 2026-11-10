"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

const BARS = 40;

function formatTime(sec: number): string {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Full product-media audio stage: play/pause, scrub, and a live playback
 * waveform (Web Audio AnalyserNode on the <audio> element itself — same
 * technique as the admin WhatsApp composer's recording waveform). Bars move
 * via `transform` only; the whole visualizer is skipped under
 * prefers-reduced-motion, falling back to a static level meter.
 */
export function AudioPlayerStage({
  src,
  title,
  className,
}: {
  src: string;
  title: string;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || typeof AudioContext === "undefined") return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let analyser: AnalyserNode | null = null;
    let source: MediaElementAudioSourceNode | null = null;
    let ctx: AudioContext | null = null;

    const tick = () => {
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const step = Math.floor(data.length / BARS) || 1;
        for (let i = 0; i < BARS; i++) {
          const v = data[i * step] ?? 0;
          const scale = Math.max(0.08, Math.min(1, v / 170));
          const bar = barRefs.current[i];
          if (bar) bar.style.transform = `scaleY(${scale})`;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const setup = () => {
      if (audioCtxRef.current) return;
      ctx = new AudioContext();
      audioCtxRef.current = ctx;
      source = ctx.createMediaElementSource(el);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      rafRef.current = requestAnimationFrame(tick);
    };

    // Connecting a MediaElementSource requires a user gesture context in
    // most browsers — do it lazily on first play, not on mount.
    el.addEventListener("play", setup);
    return () => {
      el.removeEventListener("play", setup);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      void audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  }

  function onSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Number(e.target.value);
    setCurrent(el.currentTime);
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      className={cn(
        "flex aspect-[4/5] flex-col items-center justify-center gap-5 bg-[color:var(--ro-plum-900)] p-8 text-[var(--ro-sand-50)]",
        className
      )}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        className="hidden"
      />

      <span className="inline-flex size-12 items-center justify-center rounded-[var(--ro-r-full)] bg-[color-mix(in_srgb,var(--ro-sand-50)_14%,transparent)]">
        <Volume2 className="size-5" strokeWidth={1.5} aria-hidden />
      </span>

      <p className="max-w-[80%] truncate text-center text-sm font-medium">
        <bdi>{title}</bdi>
      </p>

      <div
        className="flex h-16 w-full max-w-xs items-center justify-center gap-[3px]"
        aria-hidden
      >
        {Array.from({ length: BARS }).map((_, i) => (
          <span
            key={i}
            ref={(el) => {
              barRefs.current[i] = el;
            }}
            className="h-full w-[3px] shrink-0 origin-center rounded-[var(--ro-r-full)] bg-[var(--ro-sand-50)] opacity-60 motion-reduce:opacity-30"
            style={{ transform: playing ? undefined : "scaleY(0.08)" }}
          />
        ))}
      </div>

      <div className="flex w-full max-w-xs items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--ro-r-full)] bg-[var(--ro-sand-50)] text-[color:var(--ro-plum-900)] transition-[opacity,transform] duration-[var(--ro-dur-fast)] hover:opacity-90 active:scale-[0.96]"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="size-4 fill-current" strokeWidth={1.5} aria-hidden />
          ) : (
            <Play className="size-4 fill-current ms-0.5" strokeWidth={1.5} aria-hidden />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={onSeek}
          className="h-1 flex-1 appearance-none rounded-[var(--ro-r-full)] bg-[color-mix(in_srgb,var(--ro-sand-50)_22%,transparent)] accent-[var(--ro-sand-50)]"
          style={{
            background: `linear-gradient(to right, var(--ro-sand-50) ${progress}%, color-mix(in srgb, var(--ro-sand-50) 22%, transparent) ${progress}%)`,
          }}
          aria-label="Seek"
        />
        <span className="shrink-0 font-mono text-[11px] tabular-nums opacity-80">
          <bdi dir="ltr">
            {formatTime(current)} / {formatTime(duration)}
          </bdi>
        </span>
      </div>
    </div>
  );
}

/** Compact square tile for thumbnail rails / listing cards — no controls. */
export function AudioThumbTile({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-[color:var(--ro-plum-900)] text-[var(--ro-sand-50)]",
        className
      )}
    >
      <Volume2 className="size-5" strokeWidth={1.5} aria-hidden />
    </div>
  );
}
