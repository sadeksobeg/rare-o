# VPS runbook — Rare Oud Docker/Caddy (D3)

**Scope:** package and local verify only. This document does **not** claim a live deploy was performed. Physical VPS/DNS steps are OWNER ACTIONS.

## Sizing

| Resource | Minimum | Comfortable |
|---|---|---|
| vCPU | 2 | 4 |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 80 GB+ (media + backups) |
| OS | Ubuntu 22.04/24.04 LTS | same |

Open ports: **22** (SSH), **80**, **443**. Do **not** publish Postgres (5432) to the public internet.

## Firewall (ufw example)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## DNS

1. Create **A** (and optional **AAAA**) records for `DOMAIN` → VPS public IP.
2. Wait for propagation (`dig +short DOMAIN`).
3. Caddy issues Let's Encrypt certs automatically once HTTP-01 can reach port 80.

## First deploy

```bash
# on VPS
git clone <repo> rare-oud-platform && cd rare-oud-platform
cp .env.production.example .env.production
# edit .env.production: DOMAIN, passwords, AUTH_SECRET, WHATSAPP_BUSINESS_E164

docker compose -f docker-compose.prod.yml --env-file .env.production config   # must succeed
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# schema
docker compose -f docker-compose.prod.yml --env-file .env.production exec web \
  npx prisma migrate deploy

# optional seed (dev/demo only — never production fixtures without owner OK)
# docker compose … exec web npx tsx prisma/seed.ts

npm run smoke:prod -- https://$DOMAIN
```

Volumes: Postgres data, `public/uploads`, `.wa-auth`, Caddy certs, daily backups (7-day prune via `backup` service).

## Update

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.production exec web \
  npx prisma migrate deploy
npm run smoke:prod -- https://$DOMAIN
```

## Rollback

1. `docker compose … down` (volumes retained).
2. `git checkout <previous-tag-or-sha>`.
3. `up -d --build` + `prisma migrate deploy` only if that revision’s migrations are compatible.
4. If a migration already applied and is incompatible: restore from the newest `backups/daily-*` dump (`pg_restore`) — see restore below.

## Restore

1. Stop web + worker:  
   `docker compose -f docker-compose.prod.yml --env-file .env.production stop web worker`
2. Restore DB from `db.dump` in the chosen backup folder (use `pg_restore` into the postgres service, or `npm run test:d2-restore` patterns from `scripts/d2-restore-drill.mjs`).
3. Restore uploads / wa-auth from the same backup folder into the named volumes.
4. Start services; run `npm run smoke:prod -- https://DOMAIN`.

## Local package verification (no VPS)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production.example config
# Fill a throwaway .env.production.local with DOMAIN=localhost and strong passwords, then:
# docker compose -f docker-compose.prod.yml --env-file .env.production.local up -d --build
# Smoke against http://127.0.0.1:3000 by temporarily publishing web ports, or against https://DOMAIN once DNS/certs exist.
npm run smoke:prod -- http://127.0.0.1:3000   # skips HTTPS redirect check
```

If Docker daemon is unavailable on the workstation: stop with condition **(c)** — start Docker Desktop / install Docker, then re-run `config` + build.
