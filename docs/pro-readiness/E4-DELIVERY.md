# E4 delivery (Closure Round E4)

**Date:** 2026-10-19

## Shipped

| Item | Location |
|------|----------|
| CI workflow | `.github/workflows/ci.yml` — lint, tsc, migrate, seed, week3, build, Docker (npmjs registry), audit |
| Deploy script | `scripts/deploy.sh` |
| VPS bootstrap | `scripts/server-bootstrap.sh` |
| Readiness probe | `GET /api/ready` (DB + `AUTH_SECRET` + `DATABASE_URL`) |
| RPO/RTO | `VPS-RUNBOOK.md` |
| Off-site backup stub | `scripts/backup-offsite.mjs`, `npm run backup:offsite` |

## CI environment

- Postgres 16 service container on `localhost:5432`
- `DATABASE_URL` points at service; `npm run db:seed` before `test:week3`

## Operator checklist

1. Bootstrap VPS: `sudo bash scripts/server-bootstrap.sh`
2. Clone repo, configure `.env.production`
3. `./scripts/deploy.sh` with `ENV_FILE` and optional `DEPLOY_URL`
4. Monitor `/api/health` (liveness) and `/api/ready` (readiness)

## Incomplete / follow-up

- Playwright E2E not in default CI job (browser install size).
- Live rclone sync intentionally disabled in backup stub (dry-run only).
- HTTPS smoke in CI not run (needs public DOMAIN).
