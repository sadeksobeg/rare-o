# Seed alignment — owner attachment vs §1b vs prior reconstruction

**Date:** 2026-11-13  
**Authoritative file:** `docs/shipping/shipping-rates-seed.json` (owner paste; `OWNER_CORRECTED_2026-11-12`)

## vs §1b table in MASTER-EXECUTION.md

| Rate | §1b | Owner attachment | Match |
|---|---|---|---|
| LB | `LAND_PASSENGER_CAR` $20 | same | YES |
| JO | `LAND_SLOW_MASRI` $30 | same | YES |
| JO | `LAND_FAST_PASSENGER_BUS` $70 | same | YES |
| JO | `LAND_FAST_SECURE_PRIVATE_CAR` $100 | same | YES |
| SA | `LAND_SLOW_CONSOLIDATED_RAQI` $50 consol. | same | YES |
| SA | `LAND_PASSENGER_CAR` + FAST $100 | `method` + `speedOverride: FAST` | YES |
| AE | `SHARJAH_REP` $60 | same | YES |

**Verdict:** no amount / country / method-code conflict with §1b → **no STOP** on the 7 rates.

## vs prior on-disk reconstruction (denormalized flat rates)

| Field | Prior reconstruction | Owner attachment now |
|---|---|---|
| Shape | flat `rates[]` with embedded labels | `methods[]` + `rates[]` + `_meta` |
| SA fast method code | was briefly `LAND_FAST_PASSENGER_CAR` in STOP-A import notes | **`LAND_PASSENGER_CAR` + `speedOverride: FAST`** (matches §1b) |
| RAQI `carrierLabel` | `الراقي` | **`شركة الراقي`** |
| Defaults | per-row `maxWeightKg`/`verified`/`source` | from `_meta` (+ importer fills rows) |

## DB method code `LAND_FAST_PASSENGER_CAR` (intentional, not a conflict)

`catalog-seed.notebookMethodCode()` maps `LAND_PASSENGER_CAR` + `speed=FAST` → storage code **`LAND_FAST_PASSENGER_CAR`** so LB (plain) and SA (fast) keep distinct method rows/labels. Owner seed / §1b correctly say `LAND_PASSENGER_CAR` + FAST; the DB row name is the importer’s uniqueness rewrite. No remapping required.

## Action

- `MASTER-EXECUTION.md` persisted.
- `shipping-rates-seed.json` replaced with owner attachment.
- `SHIPPING-AUDIT.md` kept (already present).
