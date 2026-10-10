# Decisions applied without owner choice (2026-10-10)

Owner deferred choices. Defaults from `RECONCILIATION.md` §9 applied for implementation:

| ID | Applied |
|----|---------|
| D27 | Product image upload allowed later (P5d) — local `public/uploads` |
| D28 | **(a)** Price remains required at launch; “Price on request” reserved for future nullable |
| D29 | Request form uses country + notes (no city field) |
| D30 | Offers: single optional product; no validity UI |
| D31 | Activity feed = union of existing event tables |
| D32 | **(a)** Outbound kill-switch read-only in UI (env) |
| D33 | Catalog filters extend listPublishedProducts (category/price/sort) |
| D34 | Specs = bilingual free text + soft `label: value` parse |
| D35 | Keep destinationCountry / shipping fields from Zod |
| D36 | Cost-breakdown file deferred; UI plan remains SoT |

These stand until the owner overrides them.
