# CHAT-F2 — production deploy

**Date:** 2026-11-12 (UTC 2026-11-11T23:00–23:13)  
**Label / SHA on VPS:** `chat-f2-unify-local` (lean working-tree patch; no Prisma migration)  
**Host:** `72.62.155.198` (`/srv/rareoud`) · compose `rare-oud-prod` · image `rare-oud-web:prod`  
**Owner approval:** written — deploy F2 as a **separate** release after 4 small no-migration fixes  
**Rollback tag:** `rare-oud-web:pre-chat-f2-20261111-230022`  
**Pre-deploy dump:** `/var/lib/rareoud/backups/rareoud-pre-chat-f2-20261111-230022.dump` (109193 bytes, TOC ~185)

## Preflight

| Check | Result |
|------|--------|
| `prisma/migrations` in deploy diff | **none** (code/UI only patch) |
| Local gates before ship | `chat-f1-checks` + `chat-f2-checks` (47) + trader gate — **PASS** (prior session) |
| Four required fixes | suggestions hide / shared-phone notice; merge confirm dialog; audit `UnifySecondarySnapshot`; confirm shot |

## Four small changes (shipped in this image)

1. **Suggestions:** panel hidden when conversation already has `traderId`; if phone matches >1 trader → neutral notice `crmSuggestSharedPhone` (no direct «ربط كتاجر»).
2. **Confirm:** manual link that would merge opens dialog with secondary/message counts — «تأكيد» / «إلغاء».
3. **Audit snapshot:** before secondary delete, payload includes `waChatId`, `remoteJid`, phone, display name, tags, counts, moved message ids (`secondarySnapshots`).
4. **Confirm shot @1440:** `docs/chat/shots/f2/f2-merge-confirm-1440.png`  
   **SEE:** عنوان «تأكيد دمج المحادثات»؛ سيُدمَج 1 محادثة إضافية مع نقل 2 رسالة؛ أزرار إلغاء / تأكيد.

## Procedure

1. Lean tarball → `/srv/rareoud` (`.env.production` restored after extract).
2. `WHATSAPP_CONNECT_ON_START=false` enforced before/after up.
3. `pg_dump` + rollback image tag.
4. One `docker build` → same `rare-oud-web:prod` for **web + worker**.
5. `skip_prisma_migrate=1`. Nginx unchanged. No WhatsApp sends from smoke/tests.

## Smoke

| Check | Result |
|------|--------|
| `/api/ready` (3010) | `ready:true` |
| `/api/health` | **200** |
| Permissions-Policy | once; `microphone=(self)` |
| Quick replies | **8** |
| `/admin/login` | **200** |
| `/trader/messages` | **307** (login redirect) |
| Admin inbox prod @1440 | «صندوق واتساب»؛ **12** محادثة — `docs/chat/shots/owner/prod-inbox-1440-after-f2.png` |
| Prod dry-run unify | `{"tradersChecked":1,"mergesNeeded":0}` |
| Logs ~5 min (23:08–23:13Z) | no error/exception/crash lines in web or worker samples |

## WhatsApp flags

| Surface | CONNECT_ON_START | OUTBOUND |
|--------|------------------|----------|
| `.env.production` | `false` | `true` (pre-existing) |
| web container | `false` | `true` |
| worker container | `false` | `true` |

`WA_V_GATE_MOCK_CONNECTED` **absent**.

## Rollback

```bash
cd /srv/rareoud
docker tag rare-oud-web:pre-chat-f2-20261111-230022 rare-oud-web:prod
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web worker
```

## Post-deploy — STOP for owner

**READ-ONLY `TEST_PHONE` simulation not run yet.**  
Owner will provide personal number as `TEST_PHONE` (+country code). Agent will report **counts only** (would auto-link / merge; whether any already has `customerId` or another `traderId`) — **no write** of that phone onto any trader. Do not set trader phone on prod until owner reviews the simulation.

WA-V self-test (mic / images / voice note after connect) still owed by owner.

## Status

**DEPLOYED.** F2 live. Awaiting `TEST_PHONE` for read-only simulation, then stop again for owner review.
