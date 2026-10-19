# Runbook — rollback

## Application rollback (no schema break)

1. Note current git SHA and image IDs.
2. `docker compose -f docker-compose.prod.yml --env-file .env.production stop web worker`
3. `git checkout <previous-known-good-sha>`
4. `docker compose … up -d --build`
5. If the previous release shares the same migrations: `prisma migrate deploy` (should be no-op).
6. `npm run smoke:prod -- https://DOMAIN`

## Database rollback (migration incompatible or bad data)

1. Stop web + worker (keep Postgres running).
2. Restore from latest `backups/daily-*` — see `backup-restore.md`.
3. Deploy matching application SHA that was live when backup was taken.
4. Smoke test + admin spot check.

## WhatsApp session

Rolling back app code does **not** revert `.wa-auth`. If session corrupt, use `whatsapp-relink.md` instead of restore unless backup includes wa-auth volume snapshot.

## Communication

Use `incident.md` template if users were impacted >5 minutes.
