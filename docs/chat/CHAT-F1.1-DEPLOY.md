# CHAT-F1.1 — production deploy

**Date:** 2026-11-11  
**Branch / SHA:** `chat/f1-fixes` @ `2b8d1d3a3a0c4016930e059a79b5cc9eb628c3e8`  
**Host:** `72.62.155.198` (`/srv/rareoud`) · compose `rare-oud-prod` · image `rare-oud-web:prod`  
**Owner approval:** written — PART A deploy (no migrations)  
**Rollback tag:** `rare-oud-web:pre-chat-f1-20261111-204224`  
**Pre-deploy dump:** `/var/lib/rareoud/backups/rareoud-pre-chat-f1-20261111-204224.dump`

## Preflight

| Check | Result |
|------|--------|
| `prisma/migrations` in diff vs `b391344` | **none** |
| Unique `traderId` index proposal | **not applied** |
| Local clock→sent gate (`scripts/chat-f11-sent-gate.mjs`) | **PASS** — status `أُرسلت` within ≤3s (`docs/chat/shots/owner/09-admin-fallback-sent-tick.png`) |

## Procedure

1. Patch tarball (code only) → `/srv/rareoud` (`.env.production` restored after extract).
2. First build attempt failed: TS `toE164Digits(phone)` nullability → fixed in `2b8d1d3`, rebuild.
3. Build once → same image for **web + worker**.
4. `skip_prisma_migrate=1`.
5. Nginx unchanged. No WhatsApp messages sent from tests/smoke.

## Smoke

| Check | Result |
|------|--------|
| `/api/ready` / `/api/health` | `ready:true` / `200` |
| Permissions-Policy | once; `microphone=(self)` |
| Quick replies | **8** |
| `/trader/messages` | **307** (login redirect, no 500) |
| Admin inbox prod shot @1440 | **12** conversations; title «صندوق واتساب» — `docs/chat/shots/owner/prod-inbox-1440-after-f11.png` |
| Logs ~5 min | see watch file (no app crash; worker idle disconnected) |

## WhatsApp flags (important)

| Surface | CONNECT_ON_START | OUTBOUND |
|--------|------------------|----------|
| `docker-compose.prod.yml` web | hardcoded `"false"` | from env |
| `.env.production` **before** hotfix | was `true` | `true` |
| web container | `false` | `true` |
| worker after first up | briefly `true` → **CONNECTED** | `true` |
| worker after owner-aligned hotfix | **`false`** → `DISCONNECTED` (socket not started) | `true` (unchanged) |

**Action taken:** set `WHATSAPP_CONNECT_ON_START=false` in `.env.production` and recreated worker so it matches the written deploy constraint. Outbound left as pre-existing `true` (compose/web already safe for connect).

`WA_V_GATE_MOCK_CONNECTED` absent.

## Rollback

```bash
cd /srv/rareoud
docker tag rare-oud-web:pre-chat-f1-20261111-204224 rare-oud-web:prod
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web worker
```

## Status

**DEPLOYED.** PART A complete. PART B (`chat/f2-unify`) is local-only next.
