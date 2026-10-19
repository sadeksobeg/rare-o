# OWASP ASVS Level 2 checklist (selected)

Use as release gate; not all L2 chapters apply to this product.

## V2 Authentication

- [x] Passwords hashed (bcrypt) for admin/trader
- [x] Login rate limiting (`lib/auth/rate-limit.ts`)
- [ ] Admin TOTP 2FA (designed — see `ADMIN-2FA.md`; not shipped)
- [x] Session tokens signed (jose)

## V3 Session management

- [x] HTTP-only session cookies
- [x] Logout clears server-side session state where applicable

## V5 Validation

- [x] Zod schemas for server actions
- [x] Honeypot field on retail request form
- [x] Retail submit rate limit

## V8 Data protection

- [x] WhatsApp auth dir not under `public/`
- [x] Optional AES-256-GCM at rest (`WHATSAPP_AUTH_KEY`, `lib/security/wa-auth-crypto.ts`)
- [ ] Field-level encryption for PII at rest (not required for current scope)

## V9 Communication

- [x] TLS termination documented (Caddy prod compose)
- [x] `security.txt` published

## V14 Configuration

- [x] Secrets via environment (not committed)
- [x] `npm run security:audit` in CI (informational)
