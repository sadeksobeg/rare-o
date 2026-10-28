# Screenshot provenance (Section 02)

Live re-capture with Chrome headless against `http://127.0.0.1:3000` **failed** in this evidence session (Chrome produced no PNG for local Next URLs; IDE browser also could not open localhost). External `https://example.com` screenshot did work, so the failure is local-app reachability from headless Chrome, not a missing binary.

Files under `docs/client-report/screens/` were therefore **copied** from prior QA captures (same viewport widths 390 / 768 / 1440) and renamed to the client-report convention:

| Report filename pattern | Source |
|---|---|
| `2.1-catalog-*-{ar\|en}.png` | `docs/ui-planning/screenshots/final-qa/catalog-*` |
| `2.6-responsive-grid-*` | same catalog final-qa set |
| `2.2-product-*-ar.png` | `docs/ui-planning/screenshots/slice-g/pdp-ar-*` |
| `2.3-filters-390-ar.png` | `docs/ui-planning/screenshots/slice-g/catalog-filtersheet-ar-390.png` |
| `2.3-search-*-ar.png` | `docs/ui-planning/screenshots/slice-g/catalog-ar-*` (catalog page; not a live `?q=` capture this session) |
| `2.5-request-form-*-ar.png` | `docs/ui-planning/screenshots/slice-g/request-ar-*` |

**Not present this session:** `2.4-cart-*`, `2.5-request-success-*`, most EN variants for product/filters/request, and any screenshot proving a filled cart or WhatsApp success UI.

HTTP route checks this session (all **200** on `127.0.0.1:3000`): see `SECTION-02-EVIDENCE.md`.
