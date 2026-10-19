# Closure D2 — PostgreSQL 16 (branch `feat/postgres-d2`)

Status: **implemented and verified on a real Postgres 16 container. Branch is NOT merged** — review, then merge.
Date of run: 2026-10-19 · Docker 29.3.1 (daemon was started by the run) · image `postgres:16-alpine`.

## What changed

| Area | Change |
|---|---|
| `docker-compose.yml` | `postgres:16-alpine`, named volume `rare_oud_pgdata`, `pg_isready` healthcheck, `POSTGRES_USER/PASSWORD/DB` default `rareoud/rareoud/rareoud`, host port `${POSTGRES_PORT:-5432}` |
| `prisma/schema.prisma` | `provider = "postgresql"` (models unchanged) |
| `prisma/migrations/0_init` | single baseline generated with `prisma migrate diff --from-empty --to-schema-datamodel` (verified: `migrate diff` DB→schema = "No difference") |
| `prisma/migrations-sqlite-legacy/` | the 10 original SQLite migrations, moved (not deleted) so SQLite stays recoverable |
| `prisma/migrations/migration_lock.toml` | `provider = "postgresql"` |
| `scripts/migrate-sqlite-to-postgres.ts` | copies every table SQLite → Postgres (Node built-in `node:sqlite`, no new deps), FK-ordered, converts DateTime/Boolean/Decimal, verifies per-table **row count + primary-key hash**, prints report, exit 1 on any mismatch. Refuses non-empty target unless `--truncate`. `--self-test` runs against a throw-away database |
| `scripts/backup-daily.mjs` | Postgres URL → `pg_dump -Fc` (`db.dump`); SQLite URL → file copy as before; always copies `public/uploads` + `.wa-auth` |
| `scripts/d2-restore-drill.mjs` | dump → restore into temp DB → compare row counts of all tables; sha256 of uploads + wa-auth copies; report `D2-RESTORE-DRILL.json`; drops temp DB |
| `scripts/lib/pg-tools.mjs` | uses `pg_dump/pg_restore/psql` from PATH, else `docker exec rare-oud-postgres …` (`PG_TOOLS=docker|local`, `POSTGRES_CONTAINER`) |
| `scripts/lib/isolated-db.ts` + `whatsapp-phase-b/c/d/e-checks.ts` | those suites built a temp **SQLite** file; they now create a temp **Postgres database** (still fall back to a SQLite file when `DATABASE_URL` is `file:`) |
| `lib/db/search.ts` + 4 call sites | **behaviour fix**: SQLite `contains` is case-insensitive, Postgres is not. Catalog search and admin request/customer/WhatsApp search now use `mode: "insensitive"` when on Postgres |
| `.env.example`, `package.json` | Postgres URL active, SQLite commented; scripts below |

### npm scripts
- `npm run db:up` — `docker compose up -d --wait postgres`
- `npm run db:down`
- `npm run db:migrate` — `prisma migrate deploy` (was `migrate dev`; that is now `db:migrate:dev`)
- `npm run db:migrate-sqlite-pg -- [--sqlite prisma/dev.db] [--truncate]` — real data copy
- `npm run test:migrate-sqlite-pg` — self-test (temp DB, copy, verify, drop)
- `npm run test:d2-restore` — Postgres restore drill

## Local environment notes (this machine)
- Host port **5432 was already taken** by another project's container (`cityquest-postgres`). Ran with `POSTGRES_PORT=5440` and `DATABASE_URL=postgresql://rareoud:rareoud@localhost:5440/rareoud?schema=public` in the (git-ignored) `.env`. Default stays 5432.
- A stale `next start` for this repo (pid 41308) locked Prisma's query-engine DLL on Windows and was stopped to allow `prisma generate`. **Restart your app/worker after pulling this branch** (it needs the Postgres client).
- Original `.env` and `prisma/dev.db` copies are in `tmp/` (untracked) — `prisma/dev.db` itself was never modified (read-only source).

## Suite results (Postgres 16, migrated data from `prisma/dev.db`)

| Command | Result |
|---|---|
| `docker compose up -d --wait postgres` | PASS (healthy) |
| `prisma migrate deploy` (0_init) / `migrate status` / `migrate diff` DB↔schema | PASS / up to date / no difference |
| `npm run db:migrate-sqlite-pg -- --truncate` (real) | PASS — 21 tables, 247 rows, counts + id hashes match (`D2-MIGRATION-REPORT.json`) |
| `npm run test:migrate-sqlite-pg` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS (1 pre-existing warning, `cart-provider.tsx`) |
| `npx next build --no-lint` | PASS (36/36 static pages) |
| `npm run build` (with in-build lint) | **FAIL — environmental**: V8 `Fatal process out of memory: Zone` during the lint step with ~1 GB free RAM (3 attempts). Same lint passes standalone; build passes with `--no-lint`. Re-run on a machine/CI with free memory. Not investigated against master, so unproven whether this is new |
| `npm run check:i18n` | PASS |
| `npm run check:ar-enums` | PASS |
| `npm run test:week3` | PASS (58 / 0) |
| `npm run test:wholesale-security` | PASS |
| `npm run test:slice-a-kpi` | PASS |
| `npm run test:whatsapp-phase-a` | PASS |
| `npm run test:whatsapp-phase-b` | **FAIL 20/1** — "health row has no QR material": asserts the health row JSON never contains "qr", but column `qrDataUrl` (added by the C2 migration) makes that true by name. DB-independent stale assertion, not caused by Postgres |
| `npm run test:whatsapp-phase-c` | **FAIL 27/1** — "AR kill-switch copy present": dictionary text assertion. DB-independent, not caused by Postgres |
| `npm run test:whatsapp-phase-d` | PASS (46) — on temp Postgres DB |
| `npm run test:whatsapp-phase-e` | PASS (41) — on temp Postgres DB |
| `node scripts/backup-daily.mjs` | PASS (`pg_dump` via docker, uploads + wa-auth copied) |
| `npm run test:d2-restore` | PASS — 22/22 tables match after restore, 0 checksum mismatches (`D2-RESTORE-DRILL.json`) |
| Smoke: `next start` on Postgres → `/api/health`, `/catalog`, `/catalog?q=oud` vs `q=OUD` | PASS (same result either case) |
| `test:e2e`, `test:d1-*`, `test:c6-*`, `test:c1-audit` (Playwright/Lighthouse) | NOT RUN (need a browser + dev server; out of scope here) |

Suite is therefore **green except two pre-existing, DB-independent whatsapp-phase b/c assertions** and the OOM'd in-build lint.

## Cut-over (production)
1. Provision Postgres 16 (compose on the VPS, or managed). Set `DATABASE_URL`.
2. Stop app + worker. `node scripts/backup-daily.mjs` (SQLite copy), keep it 30 days.
3. `npm ci && npx prisma generate && npm run db:migrate`.
4. `npm run db:migrate-sqlite-pg -- --sqlite <path to prod dev.db>` — must print `MIGRATION VERIFIED OK`.
5. Start app + worker, probe `/api/health`, run `npm run test:d2-restore`.

## Staying on / returning to SQLite (fallback — nothing was deleted)
If the suite fails or you decide not to cut over:
1. Do **not** merge `feat/postgres-d2` (master is untouched and still SQLite).
2. To revert on this branch/after merge:
   ```
   git rm -r --cached prisma/migrations/0_init && rm -r prisma/migrations/0_init
   git mv prisma/migrations-sqlite-legacy/* prisma/migrations/
   git checkout master -- prisma/schema.prisma prisma/migrations/migration_lock.toml   # provider = "sqlite"
   # .env: DATABASE_URL="file:./dev.db"
   npx prisma generate
   ```
3. Code stays compatible: `lib/db/search.ts` only emits `mode: "insensitive"` for postgres URLs; `scripts/lib/isolated-db.ts`, backup and `d1-restore-drill.mjs` still handle SQLite.
4. Postgres data can be dropped with `npm run db:down` (+ `docker volume rm rare-oud-platform_rare_oud_pgdata`).

## Known caveats
- Only the `@prisma/client` Postgres engine is generated; run `prisma generate` after switching providers.
- `Decimal` is `DECIMAL(65,30)` in Postgres (Prisma default); values copied from SQLite are exact strings.
- Future schema changes: create migrations with `npm run db:migrate:dev` against Postgres (SQLite migrations are legacy).
