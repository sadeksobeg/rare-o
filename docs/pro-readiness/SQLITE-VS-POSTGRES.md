# SQLite vs PostgreSQL — decision memo (no migration in this program)

> **Update — Closure D2 (2026-10-19):** PostgreSQL 16 is implemented on branch `feat/postgres-d2` (compose, `0_init` migration, data-copy script with verification, pg_dump backup + restore drill). Results and the SQLite fallback procedure are in `POSTGRES-D2.md`. The memo below is kept as the original decision record; its 'later' migration plan has now been executed on the branch.

## Current state

- Production-capable **SQLite** via Prisma (`provider = "sqlite"`).
- Suitable for single-node VPS, low concurrent admin/trader load.

## When to stay on SQLite

- One app process, modest traffic, simple ops.
- File backups (`scripts/backup-daily.mjs`) are enough with off-box copies.
- WhatsApp worker + Next on the same host.

## When to move to PostgreSQL

- Multiple app replicas or high concurrent writes.
- Managed daily backups / PITR from the hoster.
- Stronger concurrent locking under admin + inbox + trader peaks.

## Migration plan (later — do not execute now)

1. Provision managed Postgres; snapshot SQLite.
2. Add `prisma` datasource URL switch; generate Postgres-compatible migration from schema.
3. Use `pgloader` or Prisma data-transfer scripts for one-time copy.
4. Dual-run read checks; cut over DNS/process; keep SQLite backup for 30 days.
5. Update runbook + restore drill on Postgres.

**Decision for launch:** remain on SQLite unless concurrent load or hoster policy requires Postgres.
