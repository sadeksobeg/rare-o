"use client";

/**
 * Incoming-message chime for the admin inbox. Synthesised with WebAudio so no
 * asset ships; browsers only allow audio after a user gesture, so the context
 * is created/resumed on the first click or key press anywhere on the page.
 */

const MUTE_KEY = "ro-inbox-sound-muted";

let ctx: AudioContext | null = null;
let unlockInstalled = false;
let lastPlayedAt = 0;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  return ctx;
}

export function installInboxSoundUnlock() {
  if (unlockInstalled || typeof window === "undefined") return;
  unlockInstalled = true;
  const unlock = () => {
    const c = getCtx();
    if (c && c.state === "suspended") void c.resume().catch(() => undefined);
  };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
  window.addEventListener("touchstart", unlock, { passive: true });
}

export function isInboxSoundMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setInboxSoundMuted(muted: boolean) {
  try {
    if (muted) window.localStorage.setItem(MUTE_KEY, "1");
    else window.localStorage.removeItem(MUTE_KEY);
  } catch {
    /* storage unavailable — keep session default */
  }
}

/** Two soft sine tones (~300 ms). Rate-limited so a burst plays once. */
export function playInboxChime() {
  if (isInboxSoundMuted()) return;
  const now = Date.now();
  if (now - lastPlayedAt < 700) return;
  const c = getCtx();
  if (!c || c.state !== "running") return;
  lastPlayedAt = now;
  const t0 = c.currentTime;
  const tone = (freq: number, start: number, dur: number) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0 + start);
    gain.gain.exponentialRampToValueAtTime(0.22, t0 + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0 + start);
    osc.stop(t0 + start + dur + 0.02);
  };
  tone(880, 0, 0.16);
  tone(1175, 0.14, 0.2);
}
