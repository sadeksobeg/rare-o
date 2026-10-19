# Encryption and storage

## Secrets (environment)

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Session signing (min 16 chars) |
| `DATABASE_URL` | Postgres connection |
| `WHATSAPP_AUTH_KEY` | Optional 32-byte key (hex/base64) or passphrase → SHA-256 for AES-256-GCM |
| `WHATSAPP_AUTH_DIR` | Baileys multi-file auth (default `.wa-auth`) |

Never commit `.env` or session directories.

## WhatsApp session at rest

When `WHATSAPP_AUTH_KEY` is set:

1. Worker startup: `hydrateAuthDirFromEncrypted()` writes plaintext JSON for Baileys.
2. Shutdown (`SIGINT`/`SIGTERM`): `sealAuthDirEncrypted()` writes `*.waenc` and removes plaintext files.

Algorithm: **AES-256-GCM** with random 12-byte IV and 16-byte tag (`lib/security/wa-auth-crypto.ts`).

Fake adapter does not require hydration (no Baileys file IO).

## Database

Postgres on VPS (encrypted volume at rest is an **operator** responsibility). Daily backups: `npm run backup:daily`; off-site stub: `npm run backup:offsite -- --dry-run` (rclone).

## Uploads

Product media under `public/uploads/` — served only for published assets; admin upload validates type/size in application code.
