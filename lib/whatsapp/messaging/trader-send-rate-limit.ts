/**
 * In-memory per-trader platform-send rate limit (CHAT-F1).
 * Same bucket shape as login rate-limit — single-node; Redis later if needed.
 */

type Bucket = {
  count: number;
  windowStartedAt: number;
};

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

export function checkTraderSendRateLimit(
  traderId: string
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const key = traderId.trim();
  let b = buckets.get(key);
  if (!b || now - b.windowStartedAt > WINDOW_MS) {
    b = { count: 0, windowStartedAt: now };
  }
  if (b.count >= MAX_PER_WINDOW) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((b.windowStartedAt + WINDOW_MS - now) / 1000)
    );
    buckets.set(key, b);
    return { ok: false, retryAfterSec };
  }
  b.count += 1;
  buckets.set(key, b);
  return { ok: true };
}

/** Test helper — clear buckets between cases. */
export function resetTraderSendRateLimitForTests(): void {
  buckets.clear();
}
