# Phase 6 — Catalog and system

Branch: `phase/06-catalog-system`. Screens CAT-01 … SYS-03 (MASTER-BUILD-PLAN Part C4).
Not in design-lab — built against VISION / BUILD-PLAN on the real app.

## Quality gate

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npx next lint` on touched files | PASS |

## Screen status

| ID | Route | Status | Notes |
|---|---|---|---|
| CAT-01 | `/admin/products`, `/new`, `/[id]` | Done | Gallery view + quick publish toggle; form completeness meters + live card preview + sticky save. Publish still requires Arabic name + ≥1 image (existing rules). |
| CAT-02 | `/admin/categories` | Done | Card grid with HTML5 drag reorder → `adminReorderCategoriesAction`. Delete still blocked when products exist / launch. **No cover-image field on `Category`** — letter avatar used instead (not invented). |
| CAT-03 | `/admin/offers`, `/admin/promos` | Done | Offers: live card preview beside editor (schema has no offer image / schedule). Promos: live tone preview + validity progress bar from real `startsAt`/`endsAt`. Both routes kept (distinct domain). |
| SYS-01 | `/admin/notifications` | Done | Synthetic hub from `actionQueue` + unread inbox KPI. No notification table in Prisma. Trader `/trader/notifications` already existed. |
| SYS-02 | `/admin/settings` | Done | Hub cards → inbox (WA), public contact (brand), `/admin/settings/security`. No invented WA reconnect page; inbox remains the WA control surface. |
| SYS-03 | Command palette | Done | Query match highlighting via `highlightMatch`. Pages include settings + notifications. No separate `/admin/search` results route (palette is the productized search). |

## Missing data sources (report only)

1. Category cover images — not on schema; cards use monogram.
2. PublicCuratedOffer image / scheduled publish — not on schema; preview is title/summary/product only.
3. Dedicated admin notification persistence (read/unread rows) — hub is queue-derived.
4. Brand contact hours editable in-admin — still env / public contact page.

## REVIEW-LOG

**Pass 1:** Wired gallery publish + reorder actions first so list UX had real mutations. Verified product publish guards match existing nameAr/image rules.

**Pass 2:** Settings hub intentionally deep-links to inbox/security rather than duplicating WA Stage A controls. Command highlight only when `q.length >= 2` (same threshold as API search).
