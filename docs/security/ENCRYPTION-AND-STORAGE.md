# Encryption and storage (Contract 7.1)

**Status:** PASS — sensitive credentials and sessions are encrypted/hashed; traffic on production is TLS; secrets stay out of git.

Contract wording: *“Sensitive data encrypted and stored securely.”*  
This means **application-layer protection of credentials and sessions**, plus **HTTPS in production** — not field-level encryption of every Postgres column (explicitly out of scope; see `ASVS-L2.md` V8).

## Secrets (environment)

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Session JWT signing + TOTP encryption key material (min 16 chars; **≥32 recommended in production**) |
| `DATABASE_URL` | Postgres connection (production uses TLS `sslmode=require` where applicable) |
| `WHATSAPP_AUTH_KEY` | **Recommended in production** — 32-byte key (hex/base64) or passphrase → SHA-256 for AES-256-GCM on Baileys session files |
| `WHATSAPP_AUTH_DIR` | Baileys multi-file auth (default `.wa-auth`; never under `public/`) |

Never commit `.env`, `.env.production`, or session directories (see `.gitignore`).

## Passwords

- Admin and trader passwords: **bcrypt** cost 12 (`lib/auth/admin-session.ts`, trader session helpers).
- Recovery codes for admin 2FA: bcrypt hashes only (`totpRecoveryHashes`).

## Sessions

- Admin / trader cookies: **HTTP-only**, `SameSite=Lax`, **`Secure` in production**.
- Tokens: **JWT** via `jose` (`SignJWT` / `jwtVerify`), keyed by `AUTH_SECRET`.

## Admin TOTP (2FA)

- Secrets stored as **AES-256-GCM** blobs (`encryptTotpSecret` / `decryptTotpSecret` in `lib/auth/totp.ts`).
- Key derivation: HMAC-SHA256(`AUTH_SECRET`, domain `"rare-oud-totp"`).
- UI: `/admin/settings/security`. Tests: `npm run test:f3-2fa`.
- Optional: `REQUIRE_ADMIN_2FA=1` blocks login until enrolled.

## WhatsApp session at rest

When `WHATSAPP_AUTH_KEY` is set:

1. Worker startup: `hydrateAuthDirFromEncrypted()` writes plaintext JSON for Baileys.
2. Shutdown (`SIGINT`/`SIGTERM`): `sealAuthDirEncrypted()` writes `*.waenc` and removes plaintext files.

Algorithm: **AES-256-GCM**, random 12-byte IV, 16-byte tag (`lib/security/wa-auth-crypto.ts`).

**Launch policy:** live WhatsApp connect/outbound remain **off** until the owner explicitly enables them (`WHATSAPP_CONNECT_ON_START=false`, `WHATSAPP_OUTBOUND_ENABLED=false`). Encryption for the auth directory is ready; pairing is a separate contract section (09).

## Transit (TLS)

- Production site: **HTTPS** on `https://rareoud.com` (Let’s Encrypt via host nginx / certbot — `deploy/nginx-rareoud.com.conf`).
- App also sets **HSTS** in production (`next.config.ts`).
- Alternate package path: Caddy auto-HTTPS in `docker-compose.prod.yml` / `deploy/Caddyfile`.

## Database & uploads

- Postgres data directory and upload volumes: **operator / VPS disk** responsibility (standard for this stack).
- Daily backups: `npm run backup:daily` (DB + uploads + WA auth dir) — contract **7.2**.
- Product media under upload paths — type/size validated on admin upload; not world-listed as a public directory index.

## Verification

```bash
npm run test:security-storage
npm run test:f3-2fa
npm run test:f5-security
```

## Explicit non-goals (not required for 7.1)

- Field-level encryption of customer names/phones in Postgres.
- Client-side encryption of catalog content.
- Enabling live WhatsApp QR / outbound messaging (section 09 / owner gate).
