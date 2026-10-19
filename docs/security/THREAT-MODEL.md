# Threat model (STRIDE, concise)

**System:** Rare Oud — Next.js web, Postgres, WhatsApp worker (Baileys/fake), Caddy TLS.

| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| **S** Spoofing | Stolen admin/trader session | HTTP-only cookies, `AUTH_SECRET`, JWT via jose; login rate limit + lockout |
| **T** Tampering | IDOR on deals/wholesale | Server-side ownership checks; E2E IDOR regression |
| **R** Repudiation | Disputed retail handoff | Retail request records + idempotency key; WhatsApp message log (worker) |
| **I** Information disclosure | WA session files, uploads | `.wa-auth` outside `public/`; optional `WHATSAPP_AUTH_KEY` encryption at rest |
| **D** Denial of service | Request spam | Public retail rate limit; login lockout |
| **E** Elevation | Trader → admin | Role-separated sessions; forbidden route for wrong role |

## Out of scope (document only)

- DDoS at network edge (use VPS firewall + CDN/WAF).
- Physical access to VPS (operator controls SSH keys).

## Trust boundaries

1. Browser ↔ Next.js (untrusted input — Zod validation, honeypot on retail form).
2. Next.js ↔ Postgres (parameterized Prisma).
3. Worker ↔ WhatsApp (Baileys); worker must not share auth dir with web process.
