# Deployment runbook — Rare Oud (Project B)

## Stack

- Next.js 15 app + Prisma **PostgreSQL 16** (D2; see `POSTGRES-D2.md`; SQLite is the documented fallback, see `SQLITE-VS-POSTGRES.md`)
- Optional WhatsApp worker (`npm run worker:whatsapp`)
- Reverse proxy with TLS (Caddy / nginx)
- **Docker production package (D3):** `Dockerfile`, `docker-compose.prod.yml`, `deploy/Caddyfile`, `.env.production.example` — step-by-step VPS: [`VPS-RUNBOOK.md`](./VPS-RUNBOOK.md). Smoke: `npm run smoke:prod -- https://DOMAIN`.

## VPS checklist

1. Node 20+ LTS, process manager (pm2 or systemd).
2. Persistent volumes:
   - App checkout
   - PostgreSQL data (compose volume `rare_oud_pgdata` or managed instance)
   - `public/uploads`
   - `WHATSAPP_AUTH_DIR` (secret-class)
3. Copy `.env.example` → `.env` on server; set `AUTH_SECRET`, admin seed, `WHATSAPP_*`.
4. `npm run db:up` (if using the bundled compose Postgres), then `npm ci && npx prisma generate && npm run db:migrate` (= `prisma migrate deploy`). First cut-over from SQLite: `npm run db:migrate-sqlite-pg -- --sqlite <path>`.
5. `npm run build && pm2 start npm --name rare-oud -- start`
6. `pm2 start npm --name rare-oud-wa -- run worker:whatsapp` when connecting WhatsApp.
7. Proxy `https://domain` → `127.0.0.1:3000`; enable HSTS at proxy.
8. Cron: `node scripts/backup-daily.mjs` daily (runs `pg_dump -Fc` for Postgres URLs, plus uploads + wa-auth); store off-box. Verify quarterly with `npm run test:d2-restore`.
9. Probe: `GET /api/health` must return `{ ok: true }`.

## SSL / domain

Terminate TLS at reverse proxy; point DNS A/AAAA to VPS. App assumes HTTPS in production for HSTS header from Next.
