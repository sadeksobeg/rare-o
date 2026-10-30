/**
 * In-memory login rate limit + lockout (single-node).
 * For multi-instance production, replace with Redis / edge KV.
 */

type Bucket = {
  failures: number;
  firstFailureAt: number;
  lockedUntil: number;
};

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function key(scope: string, identity: string) {
  return `${scope}:${identity.trim().toLowerCase()}`;
}

export function isLoginLocked(
  scope: string,
  identity: string
): { locked: boolean; retryAfterSec?: number } {
  const b = buckets.get(key(scope, identity));
  if (!b) return { locked: false };
  const now = Date.now();
  if (b.lockedUntil > now) {
    return {
      locked: true,
      retryAfterSec: Math.ceil((b.lockedUntil - now) / 1000),
    };
  }
  if (now - b.firstFailureAt > WINDOW_MS) {
    buckets.delete(key(scope, identity));
    return { locked: false };
  }
  return { locked: false };
}

export function recordLoginFailure(
  scope: string,
  identity: string
): { locked: boolean; retryAfterSec?: number } {
  const k = key(scope, identity);
  const now = Date.now();
  let b = buckets.get(k);
  if (!b || now - b.firstFailureAt > WINDOW_MS) {
    b = { failures: 0, firstFailureAt: now, lockedUntil: 0 };
  }
  b.failures += 1;
  if (b.failures >= MAX_FAILURES) {
    b.lockedUntil = now + LOCKOUT_MS;
  }
  buckets.set(k, b);
  if (b.lockedUntil > now) {
    return {
      locked: true,
      retryAfterSec: Math.ceil((b.lockedUntil - now) / 1000),
    };
  }
  return { locked: false };
}

export function clearLoginFailures(
  scope: string,
  identity: string
): void {
  buckets.delete(key(scope, identity));
}
