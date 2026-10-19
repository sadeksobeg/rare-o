/**
 * Lightweight in-memory rate limits for anonymous public actions (single-node).
 * Replace with Redis / edge KV for multi-instance production.
 */

type Bucket = {
  count: number;
  windowStart: number;
};

const buckets = new Map<string, Bucket>();

function bucketKey(scope: string, identity: string): string {
  return `${scope}:${identity.trim().toLowerCase()}`;
}

export function consumeRateLimit(input: {
  scope: string;
  identity: string;
  max: number;
  windowMs: number;
}): { allowed: boolean; retryAfterSec?: number } {
  const k = bucketKey(input.scope, input.identity);
  const now = Date.now();
  let b = buckets.get(k);
  if (!b || now - b.windowStart > input.windowMs) {
    b = { count: 0, windowStart: now };
  }
  b.count += 1;
  buckets.set(k, b);
  if (b.count <= input.max) {
    return { allowed: true };
  }
  const retryAfterSec = Math.ceil(
    (b.windowStart + input.windowMs - now) / 1000
  );
  return { allowed: false, retryAfterSec: Math.max(1, retryAfterSec) };
}

/** Retail request submit — keyed by client IP + phone fingerprint. */
export function checkRetailRequestRateLimit(input: {
  clientKey: string;
  phone: string;
}): { allowed: boolean; retryAfterSec?: number } {
  const identity = `${input.clientKey}|${input.phone.replace(/\D/g, "").slice(-12)}`;
  return consumeRateLimit({
    scope: "retail-request",
    identity,
    max: 8,
    windowMs: 15 * 60 * 1000,
  });
}
