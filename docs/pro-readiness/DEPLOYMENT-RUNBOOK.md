# Deployment runbook — Rare Oud (Project B)

## Stack

- Next.js 15 app + Prisma SQLite (see `SQLITE-VS-POSTGRES.md`)
- Optional WhatsApp worker (`npm run worker:whatsapp`)
- Reverse proxy with TLS (Caddy / nginx)

## VPS checklist

1. Node 20+ LTS, process manager (pm2 or systemd).
2. Persistent volumes:
   - App checkout
   - `prisma/dev.db` (or Postgres later)
   - `public/uploads`
   - `WHATSAPP_AUTH_DIR` (secret-class)
3. Copy `.env.example` → `.env` on server; set `AUTH_SECRET`, admin seed, `WHATSAPP_*`.
4. `npm ci && npx prisma generate && npx prisma migrate deploy` (or `db push` for SQLite drift cases).
5. `npm run build && pm2 start npm --name rare-oud -- start`
6. `pm2 start npm --name rare-oud-wa -- run worker:whatsapp` when connecting WhatsApp.
7. Proxy `https://domain` → `127.0.0.1:3000`; enable HSTS at proxy.
8. Cron: `node scripts/backup-daily.mjs` daily; store off-box.
9. Probe: `GET /api/health` must return `{ ok: true }`.

## SSL / domain

Terminate TLS at reverse proxy; point DNS A/AAAA to VPS. App assumes HTTPS in production for HSTS header from Next.
