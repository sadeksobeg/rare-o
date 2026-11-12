# WhatsApp runbook / دليل واتساب

## Connect / الاتصال

1. Keep `WHATSAPP_CONNECT_ON_START=false` until the owner explicitly enables a stability window.
2. In `/admin/inbox` open the connection sheet → Pair / QR.
3. Scan **once** on the production worker only. Never restore `.wa-auth` onto a second server.

## Disconnect / قطع الاتصال

- Connection sheet → Disconnect / logout.
- Worker writes `WhatsAppConnectionHealth.state=DISCONNECTED`.
- Inbox shows the existing red disconnect banner.

## Kill switch / مفتاح الإيقاف

| Control | Where | Effect |
|---------|-------|--------|
| Env `WHATSAPP_OUTBOUND_ENABLED` | `.env.production` + compose | Master outbound allow |
| DB `outboundKillSwitch` | Inbox connection sheet / `whatsapp-actions` | Immediate pause without restart |
| Env `WHATSAPP_CONNECT_ON_START` | worker env (compose hardcodes web `false`) | Auto-connect on boot |

When outbound is disabled or kill switch is on, admin replies use the **platform** channel (`«عبر المنصة»`); trader still sees them. Re-enable → next WhatsApp-capable reply can enqueue to Baileys again.

**Production read (no sends):** web/worker currently `CONNECT_ON_START=false`, `OUTBOUND` as set in env. Confirm with `printenv` inside containers.

## Restore WhatsApp session without QR / استعادة الجلسة بلا QR

Auth is **not** inside `pg_dump`. It lives at `/var/lib/rareoud/wa-auth` (container `/app/.wa-auth`).

1. Stop worker: `docker compose -p rare-oud-prod … stop worker`
2. Restore auth directory from daily backup:  
   `cp -a /var/lib/rareoud/backups/daily-<stamp>/wa-auth/. /var/lib/rareoud/wa-auth/`
3. Permissions: owner uid matching container (`1001`), mode `700` on dir.
4. Start worker with `WHATSAPP_CONNECT_ON_START=true` **only** if the owner approved reconnect. Otherwise start worker and use the inbox reconnect command.
5. Never copy auth to a laptop or second VPS.

## Restore DB / استعادة قاعدة البيانات

1. Prefer a tagged pre-release dump under `/var/lib/rareoud/backups/rareoud-pre-*.dump` or `daily-*/db.dump`.
2. Restore into a **scratch** database first; compare row counts; only then plan a production restore window.
3. Production restore (owner-approved): stop web+worker, `pg_restore` into `rareoud`, start services.

## Rollback image / الرجوع لصورة

```bash
cd /srv/rareoud
docker tag rare-oud-web:pre-wa-closure-<timestamp> rare-oud-web:prod
# or an older tag: pre-chat-f2-… / pre-chat-f1-… / pre-wa-v-…
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web worker
```

## Alerts / التنبيهات

| Alert | When | Notes |
|-------|------|-------|
| WhatsApp outage | Was connected, dropped > N minutes (default 5, `WHATSAPP_DISCONNECT_ALERT_MINUTES`) | **Suppressed** while `CONNECT_ON_START=false`, kill switch on, or never connected |
| WhatsApp recovered | After a recorded outage, state returns CONNECTED/CONNECTING | One recovery notice |
| Disk 80% / 90% | Volume holding backups/media/auth | In-app only; de-duped per day |
| Email | — | **Not configured** — no mail send path in app |

Inbox banner for disconnect remains the primary on-screen signal.

## Logs / السجلات

```bash
docker logs --since 10m rare-oud-prod-web-1
docker logs --since 10m rare-oud-prod-worker-1
curl -fsS http://127.0.0.1:3010/api/health   # includes whatsapp.state
```

## Backups / النسخ

- Service `backup` runs `deploy/backup-loop.sh` daily.
- Retention: `BACKUP_RETENTION_DAYS=14`.
- Each `daily-*` folder: `db.dump` + `uploads` + `uploads-storage` + `wa-auth`.
- Backups stay on the server under `/var/lib/rareoud/backups` (not world-readable).

## Ban-risk guidance / تقليل خطر الحظر

- One Baileys session only.
- No bulk sends; respect outbound rate (`outboundGlobalRatePerMin`).
- Prefer human pacing; use platform fallback during outages.
- Long-term path: official WhatsApp Cloud API (out of scope for this closure).

## Health

`GET /api/health` and `/api/ready` expose `whatsapp.state`: `connected` | `disconnected` | `reconnecting` — no phone numbers or JIDs.
