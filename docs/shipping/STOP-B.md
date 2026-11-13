# STOP-B — Pre-deploy package (shipping 2b + 2c)

Branch `shipping/phase-2` @ `3a68715` · prod currently `7be0c38` (web-only, WhatsApp connected).
**Nothing here is deployed. Release only after the owner writes `DEPLOY NOW`.**

## Gates run on this commit (local, Windows, production build)
| Gate | Result |
|---|---|
| `tsc --noEmit` | clean |
| `npm run lint` | 0 errors (pre-existing unused-var warnings only) |
| `npm run build` | passes; new routes `/track/[token]`, `/admin/shipping/shipments` present |
| `test:shipping-engine` | 3900 pass / 0 fail |
| `test:shipping-db` | 556 / 0 |
| `test:shipping-shipments` (new) | 36 / 0 — state machine, trader isolation, token validation, public view leaks no name/phone/address/price/actor, sanitising |
| `test:shipping-rates`, `test:week3` (62), `test:wholesale-security`, `test:security-storage`, `test:whatsapp-reply-route` (13), `test:whatsapp-w2`, `test:whatsapp-outbound-safety` | all pass |
| Not re-run this pass | `test:d1-axe`, `test:d2-restore`, full-site overflow/axe sweep, Lighthouse |
| Known pre-existing failure | `test:whatsapp-phase-c` (2 assertions on masked WhatsApp identity) — fails on clean stash too, unrelated |

## What 2c added this pass
- **Fixed a live-bug-in-waiting:** trader "شحناتي" linked to `/track/<token>`, a route that did not exist (would 404).
- `/track/[token]`: noindex/nofollow, 30 req/min/IP rate limit, token format validated before DB, only status/country/carrier/tracking/timeline exposed. Verified in browser at 390px: no horizontal overflow, Western-digit dates, 404 for unknown token.
- Admin `/admin/shipping/shipments`: create from confirmed wholesale / purchased brokerage request, status filter, guarded transitions with note + tracking number, audit-logged.
- Trader gets an **in-app** notification on create / each status change. **No WhatsApp is sent** by this feature.
- `/track` added to the middleware matcher (CSP nonce + locale).

## Migrations
Only `20261112120000_shipping_s1_additive` (additive: new shipping tables). No new migration in this pass. No DROP/ALTER of existing data. Take the usual `pg_dump` before apply.

## Also added in the follow-up pass
Print documents (`/admin/print/<id>?doc=waybill|packing|invoice`, A4, QR to /track, admin-session only — unauthenticated → 307 to login, verified), Exceptions filter (FAILED / in-transit >14d / confirmed >7d), read-only backfill dry-run (`scripts/shipping-backfill-dryrun.ts`; local DB: 53 wholesale candidates, 0 brokerage, 0 existing shipments; recommendation: do NOT auto-backfill), `COMPLIANCE-NOTES.md`, `docs/ops/SHIPPING-RUNBOOK.md`.
**Not visually verified:** the print page layout and admin Shipments UI (my attempt to mint a local admin session for a screenshot was blocked by the permission layer; owner should open them once after deploy, or approve a screenshot run).

## Still not built
Photo attachment on events; WhatsApp opt-in notifications (deliberately left out — needs owner policy).

## Release plan (when `DEPLOY NOW` arrives)
1. Web-only: `--no-deps web` so the WhatsApp worker/session is not restarted. Worker does not use shipping tables → old worker + new web is compatible.
2. `pg_dump`, tag rollback image `rare-oud-web:pre-*`, apply migration, run `shipping:import` (legacy → verified; notebook 7 → **unverified, hidden**).
3. Smoke with the dedicated smoke account only (no minting tokens for real admin/trader).
4. Rollback: re-tag previous image + restore dump (tables are additive, safe to leave).

## Owner decisions still open
1. Verify the 7 notebook rates before marking them verified (customers won't see them until then).
2. Unpublish prod demo product `shipping-calc-demo-oud` before/after release.
3. Israel appears in the ISO country list — exclude?
4. Confirm WhatsApp `OUTBOUND_ENABLED=true` policy on prod.
5. Volumetric divisor / box dimensions, and who enters product weights.
6. Approve deferring the 2c items listed above (or schedule them).
