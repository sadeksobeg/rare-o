# Closure D3 — Docker / Caddy production package (no live deploy)

Date: 2026-10-19

## Deliverables

| Artifact | Purpose |
|---|---|
| `Dockerfile` | Multi-stage Next.js 15 `output: "standalone"` image, non-root `nextjs` (uid 1001), shared by `web` + `worker`. No apt-get (avoids Debian mirror flakes). |
| `docker-compose.prod.yml` | `postgres`, `web`, `worker`, `backup`; optional `caddy` via `--profile tls` |
| `deploy/Caddyfile` | Auto-HTTPS reverse proxy to `web:3000` |
| `deploy/backup-loop.sh` | Daily `pg_dump -Fc` + uploads/wa-auth + 7-day prune (runs on `postgres:16-alpine`) |
| `.env.production.example` | Required secrets / DOMAIN |
| `scripts/smoke-prod.mjs` | `npm run smoke:prod -- https://DOMAIN` |
| `scripts/backup-prune.mjs` | Host-side retention helper (`npm run backup:prune`) |
| `docs/pro-readiness/VPS-RUNBOOK.md` | Sizing, firewall, DNS, first deploy, update, rollback, restore |

## Local verification

| Check | Result |
|---|---|
| `docker compose -f docker-compose.prod.yml --env-file .env.production.verify config` | PASS |
| `npm run smoke:prod -- http://127.0.0.1:3001` (host `next start`) | PASS — health, home, catalog, login, security headers |
| `docker build -t rare-oud-web:prod` | **FAIL on this workstation** — `npm ci` inside the build container hits `ECONNRESET` / `EIDLETIMEOUT` to npm registries (log: `D3-DOCKER-BUILD.txt`). Docker daemon is up; the failure is outbound registry connectivity from the build network, not missing files. **Re-run `docker compose … up -d --build` on the VPS (or any host with stable npm access) before first deploy.** Package + `compose config` + host `smoke:prod` remain valid. |

**No VPS deploy performed** (OWNER-ACTION: DNS + server + first image build on a network that can reach npm).

## Volumes

- `rare_oud_pgdata` — Postgres 16
- `rare_oud_uploads` — `public/uploads`
- `rare_oud_wa_auth` — WhatsApp session (secret-class)
- `rare_oud_caddy_data` / `rare_oud_caddy_config` — TLS
- `rare_oud_backups` — daily dumps (`BACKUP_RETENTION_DAYS`, default 7)

## Commands

```bash
cp .env.production.example .env.production   # fill DOMAIN + secrets
docker compose -f docker-compose.prod.yml --env-file .env.production config
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
# TLS/Caddy:
docker compose -f docker-compose.prod.yml --env-file .env.production --profile tls up -d
npm run smoke:prod -- https://$DOMAIN
```
