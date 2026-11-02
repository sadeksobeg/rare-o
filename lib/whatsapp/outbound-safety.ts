/**
 * Outbound anti-ban / number-survival layer (Baileys path).
 *
 * Priority #1: protect the linked business phone from ban pressure.
 * Does NOT lift WHATSAPP_OUTBOUND_ENABLED — that kill switch stays separate.
 *
 * Conservative defaults assume human inbox replies, not broadcasts.
 */

export type OutboundSafetyCode =
  | "RATE_LIMITED"
  | "SAFETY_CIRCUIT"
  | "OK";

export type OutboundSafetyDecision =
  | { ok: true }
  | {
      ok: false;
      code: "RATE_LIMITED" | "SAFETY_CIRCUIT";
      error: string;
      retryAfterMs: number;
    };

function envInt(name: string, fallback: number, min: number): number {
  const raw = Number(process.env[name]);
  if (!Number.isFinite(raw)) return fallback;
  return Math.max(min, Math.floor(raw));
}

/** Tunable via env — see `.env.example` / ENV-REFERENCE. */
export function getOutboundSafetyConfig() {
  return {
    /** Minimum quiet time between successful/attempted transmits. */
    minGapMs: envInt("WHATSAPP_OUTBOUND_MIN_GAP_MS", 8_000, 0),
    /** Extra random delay on top of min gap (0…max). */
    jitterMsMax: envInt("WHATSAPP_OUTBOUND_JITTER_MS_MAX", 4_000, 0),
    /** Sliding window for burst control. */
    windowMs: envInt("WHATSAPP_OUTBOUND_WINDOW_MS", 600_000, 30_000),
    /** Max transmits inside the sliding window. */
    windowMax: envInt("WHATSAPP_OUTBOUND_WINDOW_MAX", 12, 1),
    /** Max transmits per UTC calendar day. */
    dailyMax: envInt("WHATSAPP_OUTBOUND_DAILY_MAX", 60, 1),
    /** How long dispatch may sleep waiting for a slot. */
    maxWaitMs: envInt("WHATSAPP_OUTBOUND_MAX_WAIT_MS", 15_000, 0),
    /** Failures in circuitWindow that open the circuit. */
    circuitFailures: envInt("WHATSAPP_OUTBOUND_CIRCUIT_FAILURES", 5, 2),
    circuitWindowMs: envInt("WHATSAPP_OUTBOUND_CIRCUIT_WINDOW_MS", 300_000, 30_000),
  };
}

type State = {
  lastAttemptAt: number;
  windowStamps: number[];
  dayKey: string;
  dayCount: number;
  failureStamps: number[];
  circuitOpenUntil: number;
};

const state: State = {
  lastAttemptAt: 0,
  windowStamps: [],
  dayKey: "",
  dayCount: 0,
  failureStamps: [],
  circuitOpenUntil: 0,
};

function utcDayKey(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

function prune(stamps: number[], cutoff: number): number[] {
  let i = 0;
  while (i < stamps.length && stamps[i]! < cutoff) i += 1;
  return i === 0 ? stamps : stamps.slice(i);
}

function ensureDay(now: number) {
  const key = utcDayKey(now);
  if (state.dayKey !== key) {
    state.dayKey = key;
    state.dayCount = 0;
  }
}

function jitterMs(max: number): number {
  if (max <= 0) return 0;
  return Math.floor(Math.random() * (max + 1));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function snapshotLimits(now: number) {
  const cfg = getOutboundSafetyConfig();
  ensureDay(now);
  state.windowStamps = prune(state.windowStamps, now - cfg.windowMs);
  state.failureStamps = prune(
    state.failureStamps,
    now - cfg.circuitWindowMs
  );
  return cfg;
}

/**
 * Fast check for enqueue / UI — does not sleep.
 * Blocks when circuit is open or caps are already exhausted.
 */
export function assessOutboundEnqueue(): OutboundSafetyDecision {
  const now = Date.now();
  const cfg = snapshotLimits(now);

  if (state.circuitOpenUntil > now) {
    return {
      ok: false,
      code: "SAFETY_CIRCUIT",
      error:
        "Outbound safety circuit is open after repeated send failures — pause and retry later",
      retryAfterMs: state.circuitOpenUntil - now,
    };
  }

  if (state.dayCount >= cfg.dailyMax) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      error: `Daily outbound cap reached (${cfg.dailyMax})`,
      retryAfterMs: msUntilNextUtcDay(now),
    };
  }

  if (state.windowStamps.length >= cfg.windowMax) {
    const oldest = state.windowStamps[0] ?? now;
    return {
      ok: false,
      code: "RATE_LIMITED",
      error: `Outbound burst cap reached (${cfg.windowMax} / ${Math.round(cfg.windowMs / 1000)}s)`,
      retryAfterMs: Math.max(1_000, oldest + cfg.windowMs - now),
    };
  }

  return { ok: true };
}

function msUntilNextUtcDay(now: number): number {
  const d = new Date(now);
  const next = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  return Math.max(60_000, next - now);
}

/**
 * Before Baileys transmit: wait for min gap + jitter, or fail closed.
 */
export async function acquireOutboundSendSlot(): Promise<OutboundSafetyDecision> {
  const started = Date.now();
  const cfg = snapshotLimits(started);

  if (state.circuitOpenUntil > started) {
    return {
      ok: false,
      code: "SAFETY_CIRCUIT",
      error:
        "Outbound safety circuit is open after repeated send failures — pause and retry later",
      retryAfterMs: state.circuitOpenUntil - started,
    };
  }

  for (;;) {
    const now = Date.now();
    snapshotLimits(now);

    if (state.dayCount >= cfg.dailyMax) {
      return {
        ok: false,
        code: "RATE_LIMITED",
        error: `Daily outbound cap reached (${cfg.dailyMax})`,
        retryAfterMs: msUntilNextUtcDay(now),
      };
    }

    if (state.windowStamps.length >= cfg.windowMax) {
      const oldest = state.windowStamps[0] ?? now;
      const wait = oldest + cfg.windowMs - now;
      if (wait > cfg.maxWaitMs || now - started + wait > cfg.maxWaitMs) {
        return {
          ok: false,
          code: "RATE_LIMITED",
          error: `Outbound burst cap reached (${cfg.windowMax} / ${Math.round(cfg.windowMs / 1000)}s)`,
          retryAfterMs: Math.max(1_000, wait),
        };
      }
      await sleep(Math.min(wait, 2_000));
      continue;
    }

    const sinceLast = now - state.lastAttemptAt;
    const needGap = cfg.minGapMs + jitterMs(cfg.jitterMsMax) - sinceLast;
    if (needGap > 0) {
      if (needGap > cfg.maxWaitMs || now - started + needGap > cfg.maxWaitMs) {
        return {
          ok: false,
          code: "RATE_LIMITED",
          error: "Outbound pacing — wait before the next send",
          retryAfterMs: needGap,
        };
      }
      await sleep(needGap);
      continue;
    }

    // Reserve slot immediately so concurrent drains don't stampede
    state.lastAttemptAt = Date.now();
    state.windowStamps.push(state.lastAttemptAt);
    ensureDay(state.lastAttemptAt);
    state.dayCount += 1;
    return { ok: true };
  }
}

/** Call after adapter reports transport failure (not kill-switch / not-connected). */
export function recordOutboundSendFailure(now = Date.now()): void {
  const cfg = snapshotLimits(now);
  state.failureStamps.push(now);
  state.failureStamps = prune(
    state.failureStamps,
    now - cfg.circuitWindowMs
  );
  if (state.failureStamps.length >= cfg.circuitFailures) {
    state.circuitOpenUntil = now + cfg.circuitWindowMs;
    console.error(
      `[whatsapp-safety] circuit OPEN until ${new Date(state.circuitOpenUntil).toISOString()} ` +
        `(${state.failureStamps.length} failures / ${cfg.circuitWindowMs}ms)`
    );
  }
}

/** Successful transmit — cool the failure window slightly by pruning only. */
export function recordOutboundSendSuccess(now = Date.now()): void {
  snapshotLimits(now);
  // Success does not clear the whole circuit immediately; wait for window to age.
  // But if circuit was open and we somehow sent, leave untilUntil natural expiry.
}

export function getOutboundSafetyStatus(now = Date.now()) {
  const cfg = snapshotLimits(now);
  return {
    config: cfg,
    dayKey: state.dayKey || utcDayKey(now),
    dayCount: state.dayCount,
    windowCount: state.windowStamps.length,
    circuitOpen: state.circuitOpenUntil > now,
    circuitOpenUntil: state.circuitOpenUntil,
    lastAttemptAt: state.lastAttemptAt,
  };
}

/** Test-only reset. */
export function resetOutboundSafetyForTests(): void {
  state.lastAttemptAt = 0;
  state.windowStamps = [];
  state.dayKey = "";
  state.dayCount = 0;
  state.failureStamps = [];
  state.circuitOpenUntil = 0;
}
