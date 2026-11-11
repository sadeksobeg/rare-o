# WA-W2 — production deploy evidence

**Date:** 2026-11-11  
**Branch / SHA:** `wa/w2-media-actions` @ `30344ba` (+ server `prisma/schema.prisma` binaryTargets fix for OpenSSL 3)  
**Host:** `72.62.155.198` (`/srv/rareoud`)  
**Compose project:** `rare-oud-prod`

## Owner approval
Safe deploy with small UI polish in the same ship. No messages to real customers. Owner hand-tests on owner number only after this report.

## Safe procedure (executed)

| Step | Result |
|------|--------|
| Disk before | ~50% used / 49G free |
| `pg_dump -Fc` | `/var/lib/rareoud/backups/rareoud-pre-w2-20261111-082943.dump` (valid PGDMP, 170 TOC entries, gzip custom) |
| Rollback image tag | `rare-oud-web:pre-w2-20261111-083245` (= prior healthy `e2a7957007c1`) |
| Additive migration listed | `20261111100000_wa_w2_inbox_actions_media` only |
| Rebuild web+worker | Shared `rare-oud-web:prod` with ffmpeg in runner |
| `prisma migrate deploy` | Applied `20261111100000_wa_w2_inbox_actions_media` — schema up to date (19 migrations) |
| Restart | `web` healthy, `worker` up |

### Build incident (handled)
First W2 image (`7c94a399…`) failed health: Prisma Query Engine generated for `debian-openssl-1.1.x` while runner (bookworm + ffmpeg apt) needs `debian-openssl-3.0.x`.

1. Immediately retagged `pre-w2-20261111-083245` → `prod` and restored healthy web+worker.
2. Set `binaryTargets = ["native", "debian-openssl-3.0.x"]` in `prisma/schema.prisma`.
3. Rebuilt with `--no-cache` → new prod `9271313f1223`, healthy.

## Smoke (post-deploy)

| Check | Result |
|-------|--------|
| `GET /api/ready` (loopback :3010) | `ready:true` db/auth/databaseUrl |
| `https://rareoud.com/api/health` | **200** |
| `https://rareoud.com/admin/login` | **200** |
| SSE `https://rareoud.com/api/admin/inbox/events` | **401** without admin cookie (nginx → app; route live) |
| Worker ffmpeg | `/usr/bin/ffmpeg` — `5.1.9-0+deb12u1` |
| Kill switch DB | `WhatsAppConnectionHealth.outboundKillSwitch = false`; state **CONNECTED** |
| `.env.production` | `WHATSAPP_CONNECT_ON_START=true`, `WHATSAPP_OUTBOUND_ENABLED=true` **unchanged** |
| Worker process env | `CONNECT=true`, `OUTBOUND=true` |
| Web process env | `CONNECT=false` (compose hardcode — Baileys only on worker), `OUTBOUND=true` |

## Migration (additive only)
`prisma/migrations/20261111100000_wa_w2_inbox_actions_media/migration.sql`

- Desk columns on conversation (archive / mute / block)
- Message reply-to, hide-for-me, `isPtt`
- `WhatsAppQuickReplyTemplate`, `WhatsAppComposerDraft`, `WhatsAppPhoneRevealAudit`

## UI polish included in this image
1. ⋯ in thread header next to contact/search (no stray dark column)
2. Media preview renders object URL; dialog viewport-centered
3. Custom audio player (play/pause, progress, 1x/1.5x/2x)
4. File names/sizes in `<bdi dir="ltr">`
5. In-thread search no longer overlaps header actions
6. Phone mask format unified across header/list

## Disk after rebuild
`/` ~68% used / 32G free (ffmpeg layers + no-cache rebuild). Prune dangling images/cache **after** owner confirms rollback not needed.

## Explicit non-actions
- **No** outbound sends to customers from this deploy session
- Kill switch left **off** (false)
- Live WA connect/outbound flags left as they were (`true` / worker connects)

## Owner hand-test (your number only)
1. Real image → thumbnail + lightbox  
2. PDF document  
3. Voice note → plays as PTT on phone  
4. Emoji + quick replies  
5. Emergency kill switch arm/clear  

## Stop
Deploy complete with evidence above. Awaiting owner hand-test; no further deploys from this turn.
