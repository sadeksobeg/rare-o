"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const SPEEDS = [1, 1.5, 2] as const;

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function InboxAudioPlayer({
  src,
  durationSec,
  label,
}: {
  src: string;
  durationSec?: number | null;
  label?: string | null;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationSec ?? 0);
  const [speedIdx, setSpeedIdx] = useState(0);

  useEffect(() => {
    const a = new Audio(src);
    a.preload = "metadata";
    audioRef.current = a;
    const onTime = () => setCurrent(a.currentTime || 0);
    const onMeta = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) setDuration(a.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.pause();
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.playbackRate = SPEEDS[speedIdx] ?? 1;
  }, [speedIdx]);

  const progress = duration > 0 ? Math.min(1, current / duration) : 0;

  return (
    <div className="rad-ap">
      <button
        type="button"
        className="rad-ap-play"
        aria-label={playing ? "pause" : "play"}
        onClick={() => {
          const a = audioRef.current;
          if (!a) return;
          if (playing) {
            a.pause();
            setPlaying(false);
          } else {
            void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
          }
        }}
      >
        {playing ? (
          <Pause width={16} height={16} strokeWidth={1.5} aria-hidden />
        ) : (
          <Play width={16} height={16} strokeWidth={1.5} aria-hidden />
        )}
      </button>
      <div className="rad-ap-body">
        <button
          type="button"
          className="rad-ap-wave"
          aria-label="seek"
          onClick={(e) => {
            const a = audioRef.current;
            if (!a || duration <= 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
            // RTL: measure from inline-start visually — clientX still LTR coords
            const dir = getComputedStyle(e.currentTarget).direction;
            const r = dir === "rtl" ? 1 - ratio : ratio;
            a.currentTime = r * duration;
            setCurrent(a.currentTime);
          }}
        >
          <span className="rad-ap-track" aria-hidden />
          <span
            className="rad-ap-fill"
            style={{ width: `${progress * 100}%` }}
            aria-hidden
          />
          <span className="rad-ap-bars" aria-hidden>
            {Array.from({ length: 24 }).map((_, i) => (
              <i
                key={i}
                className={cn(i / 24 <= progress && "rad-on")}
                style={{ height: `${30 + ((i * 17) % 70)}%` }}
              />
            ))}
          </span>
        </button>
        <div className="rad-ap-meta">
          <span>
            {fmt(current)} / {fmt(duration || durationSec || 0)}
          </span>
          {label ? <span>{label}</span> : null}
        </div>
      </div>
      <button
        type="button"
        className="rad-ap-speed"
        aria-label="playback speed"
        onClick={() => setSpeedIdx((i) => (i + 1) % SPEEDS.length)}
      >
        {SPEEDS[speedIdx]}x
      </button>
    </div>
  );
}
