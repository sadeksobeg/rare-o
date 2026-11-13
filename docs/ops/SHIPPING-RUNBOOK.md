# Shipping runbook

## Release (only after owner writes `DEPLOY NOW`)
1. `pg_dump` to `/var/lib/rareoud/backups/`; tag rollback image `rare-oud-web:pre-<sha>`.
2. Upload tarball, run apply script for the SHA; **web only** (`--no-deps web`) — do not restart the WhatsApp worker.
3. Apply additive migration `20261112120000_shipping_s1_additive`.
4. `npm run shipping:import` (legacy → verified; notebook rates → unverified/hidden).
5. Smoke: `/api/health` build sha; `/track/<bad>` → 404; admin Shipping tabs load; quote on a PDP for a verified country.
6. Rollback: re-tag previous image, `up -d web`; tables are additive and can stay.

## Daily ops
- Create shipment: Admin → Shipping → Shipments → create from request. Move status step by step with a note; add tracking number at hand-over.
- Exceptions tab: FAILED, in-transit > 14 days, or confirmed > 7 days without progress.
- Print: Waybill / Packing / Invoice links per shipment (browser print, A4).
- Customer sees timeline at `/track/<token>` (link also in trader "شحناتي").

## Backfill
Do NOT auto-backfill. `scripts/shipping-backfill-dryrun.ts` (read-only) counts candidates; create shipments on demand instead.

## Incidents
- Wrong rate shown: Admin → Shipping → Rates → history → revert.
- Bad data/abuse on `/track`: rotate by deleting and recreating the shipment token (set a new `publicToken`) — old link then 404s.
