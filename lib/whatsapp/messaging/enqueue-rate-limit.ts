/**
 * W1 enqueue rate limits (application layer, on top of outbound-safety):
 * - ≤1 message / second / conversation
 * - ≤20 messages / minute global
 * Small jitter is applied by the worker anti-ban slot, not here.
 */

const PER_CONV_MIN_GAP_MS = 1_000;
const GLOBAL_WINDOW_MS = 60_000;
const GLOBAL_MAX_PER_WINDOW = 20;

const perConversationLast = new Map<string, number>();
const globalStamps: number[] = [];

export type EnqueueRateLimitResult =
  | { ok: true }
  | { ok: false; code: "RATE_LIMITED"; error: string };

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

  const last = perConversationLast.get(key) ?? 0;
  if (now - last < PER_CONV_MIN_GAP_MS) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      error: "Per-conversation send rate exceeded (max 1/s)",
    };
  }

  pruneGlobal(now);
  if (globalStamps.length >= GLOBAL_MAX_PER_WINDOW) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      error: "Global send rate exceeded (max 20/min)",
    };
  }

  return { ok: true };
}

/** Call only after a successful enqueue create (not on duplicate). */
export function recordEnqueueAccepted(conversationKey: string): void {
  const now = Date.now();
  const key = conversationKey.trim();
  if (!key) return;
  perConversationLast.set(key, now);
  pruneGlobal(now);
  globalStamps.push(now);
}

/** Test helper — clears in-memory windows. */
export function clearEnqueueRateLimitForTests(): void {
  perConversationLast.clear();
  globalStamps.length = 0;
}
