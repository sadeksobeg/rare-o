# Shipping STOP-A — Phase 1 gate

**Date:** 2026-11-12  
**Branch:** `shipping/s1`  
**Owner instruction:** complete Phase 1 remainder and deploy web-only to rareoud.com (worker / WhatsApp `.env` untouched).

## Workstream table

| Workstream | Status | Notes |
|---|---|---|
| SH0 audit + Phase 0 stabilize | DONE | Brokerage 500 not reproduced on prod; overflow / digits / inquiry card fixed |
| Seed align (§1b) | DONE | Rebuilt JSON; SA fast code `LAND_FAST_PASSENGER_CAR`; Israel kept in ISO list |
| Additive schema + migrate | DONE | `shipping_s1_additive` |
| DB quote engine + parity | DONE | Legacy parity 3900 offline + 556 DB; DE &lt;11kg → inquiry (intentional) |
| Idempotent importer | DONE | 88 verified legacy + 7 unverified notebook + full ISO countries |
| Admin FULL CONTROL | DONE | `/admin/shipping` hub + countries / methods / rates / history+revert / import+export / simulator / config / inquiries |
| Product weight + shipping class | DONE | Admin product form + upsert schema/service |
| Server re-quote on submit | DONE | Retail + wholesale create paths call `quote()` + store `shippingQuoteSnapshot` |
| Static prototypes + flags gallery | PARTIAL | Phase 0 shots exist under `docs/shipping/shots/`; full fake-data SH1 gallery and SVG flag pack deferred (admin uses codes; disable countries in UI) |
| Storefront / trader Phase 2 surfaces | BLOCKED / deferred | Cancelled for this ship per owner “complete Phase 1 + deploy” |

## Phase 0 leftovers (honest)

| Item | Status |
|---|---|
| Trader “1 Issue” badge | Not re-checked in this pass |
| Client selector still uses `resolveAvailableMethods` | Intentional for this ship; server is authoritative via new engine |
| WhatsApp reconnect | Owner action on `/admin/inbox` — not performed by agent |

## Gate results

| Gate | Result |
|---|---|
| `tsc --noEmit` after admin + wire | PASS |
| Engine parity / golden (prior commit) | PASS |
| Admin actions audited | PASS (`shipping.*` via `writeAdminAudit`) |
| Soft-delete default / unverified imports | PASS (service layer) |

## Screenshots

Existing Phase 0 evidence: `docs/shipping/shots/sh0-*.png` (+ NOTES.json).  
Live admin shipping screens: capture after deploy smoke (hub + rates + simulator).

## Owner decisions recorded

1. Saudi fast land method code stored as `LAND_FAST_PASSENGER_CAR` (unique vs Lebanon `LAND_PASSENGER_CAR`).
2. Full ISO country list imported including Israel — disable from admin UI if needed.
3. Seed file is §1b reconstruction (original attachment never compared).

## Deploy record (rareoud.com)

| Item | Value |
|---|---|
| SHA | `83ee2ea` |
| Dump | `/var/lib/rareoud/backups/rareoud-pre-ship-s1-20261112-102936.dump` |
| Rollback image | `rare-oud-web:pre-ship-s1-20261112-102936` |
| Web | rebuilt + restarted (healthy on `:3010`) |
| Worker | untouched (previous image still running) |
| `WHATSAPP_CONNECT_ON_START` | `false` (web + worker) |
| Migration | `20261112120000_shipping_s1_additive` applied |
| Import | 259 countries · 39 methods · 88 verified · 7 unverified |
| Smoke | `/api/health` 200 · `/api/ready` 200 · `/admin/login` 200 · `/admin/shipping` 307 (login redirect) |

Note: seed JSON is excluded by `.dockerignore`; import was completed by copying the file into the running web container after migrate.
