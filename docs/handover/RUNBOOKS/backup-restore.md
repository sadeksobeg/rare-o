# Runbook — backup & restore

## Daily backup (compose)

- Service: `backup` in `docker-compose.prod.yml`
- Local scripts: `npm run backup:daily`, `npm run backup:prune`
- Retention: `BACKUP_RETENTION_DAYS` (default 7)
- Offsite (optional): `npm run backup:offsite` with `BACKUP_OFFSITE_REMOTE`

Each backup folder should include:

- PostgreSQL dump (`db.dump` or equivalent)
- `public/uploads` checksum manifest
- WhatsApp auth checksum (if configured)

## Restore drill (validated)

- D2: `npm run test:d2-restore` — 22/22 tables + uploads checksums
- Reference: `docs/pro-readiness/D2-RESTORE-DRILL.json`

## Production restore (summary)

1. `docker compose … stop web worker`
2. Restore DB into Postgres service (`pg_restore` / project drill script).
3. Restore uploads + `.wa-auth` volumes from same timestamp.
4. `docker compose … up -d`
5. `npm run smoke:prod -- https://DOMAIN`
6. Verify admin inbox pairing if WA volume was restored.

## RPO / RTO targets (owner to confirm)

| Metric | Suggested |
|--------|-----------|
| RPO | 24h (daily backup) — tighten with offsite/hourly if required |
| RTO | 2–4h with runbook + practiced drill |
