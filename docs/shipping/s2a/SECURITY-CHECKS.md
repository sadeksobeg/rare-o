# Shipping quote API — security checks (pre-deploy 2a)

**Script:** `scripts/shipping-security-checks.ts`  
**Target:** `POST /api/shipping/quote` (local `127.0.0.1:3000`)  
**Result:** **12/12 PASS** (2026-11-13)

| Check | Expected | Result |
|---|---|---|
| Invalid JSON | uniform 400, no stack | PASS |
| Missing destination | 400 | PASS |
| Negative weight | 400 | PASS |
| Oversized destination string | 400 | PASS |
| Items array / size caps | capped; no leak | PASS |
| DE 20 kg public methods | legacy land+air only | PASS |
| LB / JO / SA notebook flats | unverified → not public | PASS |
| Client `includeUnverified` ignored | no unverified returned | PASS |
| Rate limit | 429, no leak | PASS |
| Unknown country | uniform empty/inquiry, no enum leak | PASS |

No stack traces or PII observed in error bodies. Unverified rates never returned on the public path.
