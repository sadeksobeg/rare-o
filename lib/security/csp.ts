import { randomBytes } from "node:crypto";

export function createCspNonce(): string {
  return randomBytes(16).toString("base64");
}

/**
 * PARTIAL: Next.js injects some scripts without nonces in dev; production uses
 * nonce + strict-dynamic and omits unsafe-eval.
 */
export function buildContentSecurityPolicy(nonce: string, isProd: boolean): string {
  const scriptSrc = isProd
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval'`;

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export const CSP_NONCE_HEADER = "x-ro-csp-nonce";
