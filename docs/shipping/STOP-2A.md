# STOP-2A — Pre-deploy report (NO deploy)

**Branch:** `shipping/s2a`  
**Date:** 2026-11-13  
**Owner gate:** deploy only after written `DEPLOY NOW` · **web-only** (`docker compose … up -d --no-deps web`).

## What ships in 2a (exact list)

| Item | Detail |
|---|---|
| `POST /api/shipping/quote` | Read-only; rate-limited; never `includeUnverified`; returns methods + inquiry |
| Storefront + trader selector | `ShippingCostSelector` fetches server quotes (was static `rates.ts`) |
| Trader UI | Already on `main` (R7.2–R9.1); ships with this web image |
| `/api/health` build | `{ build: { sha, builtAt } }` from `RO_GIT_SHA` / `RO_BUILD_TIME` |
| Weight labels | «الوزن المحتسب للصندوق» / «الوزن المحتسب» + help; docs in `WEIGHT-LABELS.md` |
| Dockerfile | `GIT_SHA` / `BUILD_TIME` build-args wired into builder + runner |
| **Migrations** | **None** |

## Gates

| Gate | Result |
|---|---|
| `tsc --noEmit` | PASS |
| `next lint` (touched) | PASS (warnings only cleared) |
| `shipping-engine-checks` | 3900 / 0 |
| Importer re-run ×2 | 0 created; method counts stable; SA $100 = `LAND_FAST_PASSENGER_CAR` |
| CSV export → dry-run → apply | create 0, update 0, unchanged 95; 7 notebook `verified=false` |
| UI gates (dark+light × 1440/1280/768/390, viewport-only) | **PASS** — `docs/shipping/s2a/GATES.json` |
| Selector proof (cart + DE) | `s2a-request-de20-selector-light-1440-ar.png` — label «الوزن المحتسب للصندوق», no «كيلو حجمي», cards show **130** / **150** USD |

**Honest SEE note:** matrix gates on bare `/request` hit the empty-cart state (no selector). The DE proof uses a fixture cart so the wired selector is visible.

## Quote API smoke (local)

- `DE` @ 20 kg CUSTOMER → land **130 USD**, air **150 USD** (engine + API) — also confirmed in UI proof shot.
- Unverified notebook rates absent from public quote.
- `/api/health` returns `build.sha` + `build.builtAt` (local sample SHA was current HEAD at gate time).

## Worker-compatibility analysis

| Area | Worker-reachable? | 2a change |
|---|---|---|
| `app/api/shipping/quote` | No (web App Router only) | New |
| `components/storefront/*`, trader forms | No | UI only |
| `app/api/health` | Worker may probe health URL but does not import the route module | Additive JSON fields only |
| `lib/build-info.ts`, `next.config.ts`, `Dockerfile` | Dockerfile shared image; health env only | Additive |
| `lib/shipping/engine.ts` / prisma schema | Unchanged in 2a | — |

**Verdict:** web-only restart is safe. Worker process/code path for WhatsApp is untouched; no schema change; old worker remains compatible with the DB.

## Rollback plan

1. Before deploy: `pg_dump` → `/var/lib/rareoud/backups/rareoud-pre-s2a-<timestamp>.dump`
2. Tag running image: `docker tag rare-oud-web:prod rare-oud-web:pre-s2a-<timestamp>`
3. Build new web image with `--build-arg GIT_SHA=$(git rev-parse HEAD) --build-arg BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)`
4. `docker compose -f … up -d --no-deps web` only
5. Failure → retag/run `rare-oud-web:pre-s2a-<timestamp>` on web; schema unchanged so dump restore optional

## SSH / deploy access (for owner)

This Cursor machine (`ASUS` / Windows) has:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMchRi0w514Fzdt6i/dreqovKxxLTRj0311JpUy6Uhmq rareoud-deploy@Sadek
```

File: `~/.ssh/id_ed25519_rareoud.pub`  
**Add that single line** to the VPS deploy user’s `~/.authorized_keys` (same user you used for prior rareoud deploys). After that, deploy from this machine with that key.  
Do not use alternate routes (Hostinger file panel, temporary passwords) for app deploys.

(There is also `tenegta_vps_ed25519.pub` for other Hostinger work — **not** the rareoud deploy key.)

## Open / follow-ups after deploy

- Confirm `/api/health` shows the new SHA.
- Owner section-1 tests on prod admin matrix/simulator (DE 20 → 130/150).
- Still **do not** edit/verify the 88 legacy rates until selector+server stay aligned (now both use engine).
- Phase 2 remainder (estimator page, شحناتي, tracking, docs, notifications, SVG flags) starts **after** 2a is deployed and verified.

## STOP

Waiting for owner `DEPLOY NOW` (web-only). No deploy performed by the agent.
