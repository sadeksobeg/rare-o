# OWASP ASVS Level 2 checklist (selected)

Use as release gate; not all L2 chapters apply to this product.

## V2 Authentication

- [x] Passwords hashed (bcrypt) for admin/trader
- [x] Login rate limiting (`lib/auth/rate-limit.ts`)
- [x] Admin TOTP 2FA (shipped — see `ADMIN-2FA.md`; `npm run test:f3-2fa`)
- [x] Session tokens signed (jose)

## V3 Session management

- [x] HTTP-only session cookies
- [x] Logout clears server-side session state where applicable
- [x] `Secure` cookie flag in production

## V5 Validation

- [x] Zod schemas for server actions
- [x] Honeypot field on retail request form
- [x] Retail submit rate limit

## V8 Data protection

- [x] WhatsApp auth dir not under `public/`
- [x] Optional AES-256-GCM at rest (`WHATSAPP_AUTH_KEY`, `lib/security/wa-auth-crypto.ts`)
- [x] TOTP secrets AES-256-GCM at rest (`lib/auth/totp.ts`)
- [ ] Field-level encryption for PII at rest (**not required for current scope / contract 7.1**)

## V9 Communication

- [x] TLS termination in production (nginx + Let’s Encrypt on `rareoud.com`; Caddy path also packaged)
- [x] HSTS in production (`next.config.ts`)
- [x] `security.txt` published

## V14 Configuration

- [x] Secrets via environment (not committed)
- [x] `npm run security:audit` in CI (informational)
- [x] `npm run test:security-storage` gate for contract 7.1
