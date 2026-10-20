# Content Security Policy (F3)

## Status: PARTIAL

CSP is applied in **`middleware.ts`** for matched storefront and portal routes:

- Per-request **`x-ro-csp-nonce`** request header + short-lived `ro_csp_nonce` cookie
- Production `script-src`: `'self' 'nonce-…' 'strict-dynamic'` (no `unsafe-eval`)
- Development retains `unsafe-inline` / `unsafe-eval` for Next dev tooling

Routes **outside** the middleware matcher (e.g. some `/api/*`, `/.well-known/*`, static assets) rely on **`next.config.ts`** headers only (no CSP there — HSTS / frame / MIME sniffing only).

Next.js App Router does not propagate nonces to every framework script without additional layout wiring; treat CSP as defense-in-depth, not a complete XSS kill switch.
