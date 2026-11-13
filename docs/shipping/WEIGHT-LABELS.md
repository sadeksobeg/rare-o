# Shipping weight labels (Release 2a)

**Decision (owner 2026-11-13):** until a volumetric divisor and box dimensions are supplied, UI must **not** promise a volumetric calculation.

## Labels

| Cart / context | Arabic | English |
|---|---|---|
| Oud-box heuristic carts (storefront request, current trader wholesale picker) | **الوزن المحتسب للصندوق** | Billable box weight |
| Everything else (generic / product weights later) | **الوزن المحتسب** | Billable weight |

Unit suffix: **كغ** / **kg** (Western digits). Do not use «كيلو حجمي» / «vol. kg» in customer/trader surfaces while `ShippingConfig.volumetricDivisor` is null.

Admin fields that still say «حجمي» in config/rate editors refer to the future volumetric path; the divisor remains blank by default (MASTER-EXECUTION §1).

## Formula (current)

```
product units with weightKg  → sum(unit × qty)
units without product weight → oud-box heuristic (legacy):
  pairs of 2 ouds → 25 kg each pair
  remainder 1 oud → 20 kg
billable = known product weights + heuristic for unweighed units
         + packagingKg × parcels   (packagingKg default 0)
if volumetricDivisor > 0 AND volumeCm3 known:
  billable = max(billable, volumeCm3 / volumetricDivisor)
```

Source of truth: `lib/shipping/engine.ts` (`resolveWeight`) + `lib/shipping/engine-core.ts` (`chargeableWeight`) + `lib/shipping/rates.ts` (`calculateOudShipmentWeightKg`).

**Do not invent a divisor.** When the owner sets one in `/admin/shipping` config and product dims exist, revisit labels to restore a true volumetric name.
