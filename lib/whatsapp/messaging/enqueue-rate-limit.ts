/**
 * W1 enqueue rate limits (application layer, on top of outbound-safety):
 * - ≤ PER_CONV_BURST messages / PER_CONV_WINDOW_MS / conversation (a person typing
 *   fast sends 2–3 in a row; the old hard 1/s gap rejected the second one)
 * - ≤N messages / minute global (configurable; default 20)
 * Small jitter is applied by the worker anti-ban slot, not here.
 */

const PER_CONV_WINDOW_MS = 10_000;
const PER_CONV_BURST = 5;
const GLOBAL_WINDOW_MS = 60_000;
const DEFAULT_GLOBAL_MAX_PER_WINDOW = 20;

let globalMaxPerWindow = DEFAULT_GLOBAL_MAX_PER_WINDOW;

const perConversationStamps = new Map<string, number[]>();
const globalStamps: number[] = [];

export type EnqueueRateLimitResult =
  | { ok: true }
  | { ok: false; code: "RATE_LIMITED"; error: string };

function envGlobalMax(): number | null {
  const raw = process.env.WHATSAPP_OUTBOUND_GLOBAL_RATE_PER_MIN?.trim();
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(n, 120);
}

/** Apply DB/settings value (env override wins when set). */
export function configureGlobalEnqueueRateLimit(perMin: number): void {
  const env = envGlobalMax();
  if (env !== null) {
    globalMaxPerWindow = env;
    return;
  }
  const n = Math.floor(perMin);
  if (!Number.isFinite(n) || n < 1) {
    globalMaxPerWindow = DEFAULT_GLOBAL_MAX_PER_WINDOW;
    return;
  }
  globalMaxPerWindow = Math.min(n, 120);
}

export function getGlobalEnqueueRateLimit(): number {
  const env = envGlobalMax();
  return env ?? globalMaxPerWindow;
}

function pruneGlobal(now: number) {
  while (globalStamps.length > 0 && now - globalStamps[0]! >= GLOBAL_WINDOW_MS) {
    globalStamps.shift();
  }
}

export function assessEnqueueRateLimit(
  conversationKey: string
): EnqueueRateLimitResult {
  const now = Date.now();
  const key = conversationKey.trim();
  if (!key) {
    return { ok: false, code: "RATE_LIMITED", error: "Missing conversation key" };
  }

  const recent = (perConversationStamps.get(key) ?? []).filter(
    (t) => now - t < PER_CONV_WINDOW_MS
  );
  if (recent.length >= PER_CONV_BURST) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      error: `Per-conversation send rate exceeded (max ${PER_CONV_BURST}/${PER_CONV_WINDOW_MS / 1000}s)`,
    };
  }

  pruneGlobal(now);
  const max = getGlobalEnqueueRateLimit();
  if (globalStamps.length >= max) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      error: `Global send rate exceeded (max ${max}/min)`,
    };
  }

  return { ok: true };
}

/** Call only after a successful enqueue create (not on duplicate). */
export function recordEnqueueAccepted(conversationKey: string): void {
  const now = Date.now();
  const key = conversationKey.trim();
  if (!key) return;
  const stamps = (perConversationStamps.get(key) ?? []).filter(
    (t) => now - t < PER_CONV_WINDOW_MS
  );
  stamps.push(now);
  perConversationStamps.set(key, stamps);
  pruneGlobal(now);
  globalStamps.push(now);
}

/** Test helper — clears in-memory windows. */
export function clearEnqueueRateLimitForTests(): void {
  perConversationStamps.clear();
  globalStamps.length = 0;
  globalMaxPerWindow = DEFAULT_GLOBAL_MAX_PER_WINDOW;
}
