# Environment reference

Copy from `.env.example` / `.env.production.example`. Never commit secrets.

## Required (production)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | JWT signing (≥16 chars) |
| `WHATSAPP_BUSINESS_E164` | wa.me handoff digits (no `+`) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for sitemap/OG |

## Admin / seed (bootstrap only)

| Variable | Purpose |
|----------|---------|
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Initial admin (`db:seed`) |
| `TRADER_EMAIL`, `TRADER_PASSWORD` | Optional dev trader seed |

## WhatsApp worker

| Variable | Default | Purpose |
|----------|---------|---------|
| `WHATSAPP_AUTH_DIR` | `./.wa-auth` | Baileys session (secret volume) |
| `WHATSAPP_CONNECT_ON_START` | `false` | Auto-open socket |
| `WHATSAPP_OUTBOUND_ENABLED` | `false` | Send kill switch |
| `WHATSAPP_OUTBOUND_MIN_GAP_MS` | `8000` | Min quiet time between transmits |
| `WHATSAPP_OUTBOUND_JITTER_MS_MAX` | `4000` | Extra random delay (anti-ban) |
| `WHATSAPP_OUTBOUND_WINDOW_MAX` / `_WINDOW_MS` | `12` / `600000` | Burst cap in sliding window |
| `WHATSAPP_OUTBOUND_DAILY_MAX` | `60` | UTC day transmit cap |
| `WHATSAPP_OUTBOUND_CIRCUIT_FAILURES` | `5` | Opens safety circuit after N failures |
| `WHATSAPP_ADAPTER` | `baileys` | `fake` for E2E without phone |
| `WHATSAPP_AUTH_KEY` | — | Encrypt session at rest (recommended prod) |

## Feature flags / ops

| Variable | Purpose |
|----------|---------|
| `RO_SHOW_UI_FIXTURES` | `1` shows regression rows in UI (dev only) |
| `RO_PROMO_FEATURES` | `1` enables promo/compare UI experiments |
| `APP_TIMEZONE` | Display timezone (e.g. `Asia/Damascus`) |

## Smoke / CI / tests

| Variable | Purpose |
|----------|---------|
| `SMOKE_BASE_URL` / `BASE` | Target for `smoke:prod`, `seo:validate`, load tests |
| `PLAYWRIGHT_BASE_URL` | E2E base URL |
| `E2E_AUTO_SEED` | `0` skips global seed in Playwright |
| `WHATSAPP_ADAPTER=fake` | C2 retail WhatsApp E2E |

## Backup

| Variable | Purpose |
|----------|---------|
| `BACKUP_RETENTION_DAYS` | Local prune (default 7) |
| `BACKUP_OFFSITE_REMOTE` | Optional rsync/remote target |
| `BACKUP_DRY_RUN` | Dry-run offsite sync |

See `RUNBOOKS/backup-restore.md` and `RUNBOOKS/secret-rotation.md`.
