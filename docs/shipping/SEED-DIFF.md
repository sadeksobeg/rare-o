# Seed alignment (§1b vs prior reconstruction)

Owner attachment `shipping-rates-seed.json` was **not** present in the workspace.
Local file rewritten to match **§1b authoritative table** exactly.

| Field | Prior reconstruction | §1b / now |
|---|---|---|
| JO المصري consolidation | `true` (wrong) | `false` |
| maxWeightKg | `null` | `50` |
| methodCode | absent | codes from §1b |
| source | absent | `NOTEBOOK` |
| Labels | free-form | exact §1b Arabic labels |

**Action if owner re-attaches a file:** diff against this JSON; if any amount/country/method differs, STOP import and report — do not guess.
