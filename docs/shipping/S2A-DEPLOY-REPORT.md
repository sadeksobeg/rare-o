# Shipping Release 2a — Deploy Report

**Date:** 2026-11-13  
**Branch tip:** `shipping/s2a` @ `7be0c38`  
**Mode:** web-only (`docker compose up -d --no-deps web`)  
**Migrations:** none  
**Worker / `.env` / nginx:** untouched  

## Pre-deploy (conditions)

| # | Condition | Result |
|---|---|---|
| 1 | Neutral customer copy (no مقسوم / admin config jargon) | PASS — help = «تقدير وزن الشحن بحسب حجم صناديق العود…» |
| 2 | Alt currency + weight bidi (`عند التسديد هناك 110 EUR`, `20 كغ`) | PASS — storefront proof + prod shots |
| 3 | `/api/health` short SHA (7) + `builtAt` only | PASS — `build.sha=7be0c38` |
| 4 | `scripts/shipping-security-checks.ts` | **12/12 PASS** — see `docs/shipping/s2a/SECURITY-CHECKS.md` |

Commits on `shipping/s2a` for this ship: `666337d` (2a), `23e4700` (pre-deploy copy/bidi/sha/security), `fee5c23`+`7be0c38` (build typecheck rename `URL`→`QUOTE_URL`).

## Deploy record

| Item | Value |
|---|---|
| SHA (full) | `7be0c38baada58821269a2c5762b244d3034defa` |
| SHA (health) | `7be0c38` |
| `builtAt` | `2026-11-13T06:58:14Z` |
| Dump | `/var/lib/rareoud/backups/rareoud-pre-s2a-20261113-065814.dump` |
| Rollback image | `rare-oud-web:pre-s2a-20261113-065814` |
| Web container | `baefa9cc656df03607f18e5513cc0e556f53fcfaec2e8eb2ff7a979bba6ee9a3` started `2026-11-13T07:04:34Z` |
| Worker container | `6a2dac1e55ccd63dce4a6ad9856200e43ec5be3dd20f7ce63937d382cf834d74` started `2026-11-12T11:01:16Z` |
| Worker before/after | **identical** (id + StartedAt) |
| `WHATSAPP_CONNECT_ON_START` | `false` (web + worker) |
| First build attempt | FAILED (typecheck `const URL` clash) → auto-rollback kept prior web; fixed; redeployed |

## Smoke (production)

| Check | Result |
|---|---|
| `GET /api/health` | 200 — `build.sha=7be0c38`, `builtAt=2026-11-13T06:58:14Z` |
| `POST /api/shipping/quote` DE 20 CUSTOMER | land **130 USD** / air **150 USD** (+ 110/130 EUR alt) |
| Same DE 20 TRADER audience | same 130 / 150 |
| LB / JO / SA notebook flats | inquiry / empty methods (not public) |
| AE notebook 60 USD flat | not public; verified legacy air 150 AED still ok |
| Unverified rates in DB | **7** NOTEBOOK rows (LB/JO/SA/AE); verified **88** |
| Admin `/admin/shipping/rates` | HTTP **200** with session cookie; matrix reachable |
| Trader routes | `/trader`, deals, wholesale, brokerage, offers, notifications, profile — **200**, no pageerrors |
| Storefront `/request` DE 20 | viewport shots 1440 + 390 — see below |
| Web logs ~10 min | no new error/exception lines |
| WhatsApp | `disconnected` (unchanged; reconnect is owner action on `/admin/inbox`) |

### Viewport SEE lines (honest)

- **SEE** `docs/shipping/s2a/prod-request-de20-light-1440-ar.png`: Germany selected; **20 كغ**; land **130 USD** / air **150 USD**; «عند التسديد هناك 110 EUR» / «130 EUR»; neutral box-weight help; no مقسوم/حجمي/إدارة.
- **SEE** `docs/shipping/s2a/prod-request-de20-light-390-ar.png`: same selector stacked on mobile 390; 130 USD estimate in summary.
- Trader wholesale form lives on `/trader/wholesale` (not `/new`). Server quote for TRADER audience confirmed 130/150; UI crawl of trader pages returned 200 without console errors.
- Admin rates Playwright screenshot blocked on this Windows Chromium (`net::ERR_ADDRESS_INVALID`); verified instead via authenticated HTTP 200 + DB count of 7 unverified rows.

### «تحرير الأتيليه» / trumpet image

- Prod has **0** published curated offers and **1** published product (`shipping-calc-demo-oud`) using `/brand/editorial/instrument-dark.jpg` (**HTTP 200**, 43638 bytes).
- Trader home offer-card fallback `/brand/hero-oud-atelier-d.jpg` **HTTP 200** (179385 bytes) — copied to `docs/shipping/s2a/prod-hero-oud-atelier-d.jpg` for the record.
- Both assets serve cleanly post-deploy; traders will see the fallback atelier image until real offers are published.

## Tags

- Immutable deploy tag: `shipping-2a-deployed-7be0c38` (created after this report lands on the branch).
- Rollback docker tag retained: `rare-oud-web:pre-s2a-20261113-065814` (do not retag/move).

## Follow-ups

1. Owner: reconnect WhatsApp from `/admin/inbox` if desired (agent did not touch worker).
2. Owner section-1 admin matrix visual pass (7 needs-verification rows).
3. Phase 2 continues on a **new branch** after merge to `main`.
