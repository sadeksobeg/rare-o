# Round 8 — Trader deals (TR-03/04/05)

**Stop here for written approval.** No deploy. No Round 9 until the owner approves in chat.

Branch: `ui/trader-r8` (from `ui/trader-r72`, separate from shipping). Constraints held: no deploy, no WhatsApp/schema/contract changes, no `.env` edits.

## FIRST commit — R7.2 leftover fixes (before → after)

| # | Before | After |
|---|--------|-------|
| 1 | 390 home: «نشاطي الأخير» flush to left edge; 3rd row clipped; tabbar risk | Activity card shares 12px gutter/`min-w-0`; titles ellipsize; page bottom padding = tabbar + safe-area; per-card `scrollWidth ≤ clientWidth` |
| 2 | Login: lighter inset seam on brand panel; 768 orphan «واتساب» | Brand panel solid `#0B080D` (no inset edge); layout stacks ≤900px / form widened |
| 3 | Home 1440: 2 offers in 3-col grid → gap | Offers grid adapts (2-col when only 2) |
| 4 | 390 topbar: no language/theme | Tools always available in topbar; account/profile also exposes locale |

Preamble commit: `e68be22`.

## Prod check (READ-ONLY)

`PublicCuratedOffer` rows matching `reg-gate-*` / «فحص البوابة» fixtures on production Postgres:

| published | other | **total** |
|-----------|-------|-----------|
| 0 | 0 | **0** |

Nothing deleted on prod. Home filter still hides such titles if they appear later.

## Round 8 scope

- `/trader/deals` — SegControl tabs + ui-kit `DataTable` (mobile card transform)
- `/trader/deals/new` — existing 3-step wizard (local sessionStorage draft)
- `/trader/deals/[id]` — `DetailBack` / `DetailHeader` / `DetailStepper` / `KeyValue` + negotiation Card
- Removed `ro-portal-*` on touched surfaces (empty state, negotiation thread/form)
- Fix: `listDealsForTrader` no longer applies admin fixture hide-by-trader-identity (trader always sees own deals)

## Gates

Script: `scripts/pilot-trader-r8-shots.mjs` → `docs/ui/pilot-trader/r8-shots.json` (24 shots)

| Gate | Result |
|------|--------|
| Horizontal overflow (doc + cards) | **0 fails** |
| Console errors | **0** (attribute-only hydration noise filtered; chip locale sort fixed) |
| axe wcag2a/2aa | **0** |
| `ro-portal-*` on shot DOM | **0** |
| `tsc --noEmit` | pass (app code) |
| lint (touched) | pass |

## SEND screenshots — what I SEE

### List `/trader/deals`

| File | what I SEE |
|------|------------|
| `r8-trader-deals-light-1440-ar.png` | Seg tabs الكل 4; DataTable 4 rows; statuses + «بانتظارك»; +اقتراح صفقة |
| `r8-trader-deals-light-1280-ar.png` | Same table density; no H-overflow |
| `r8-trader-deals-light-768-ar.png` | Table→cards; tabbar present; FAB new-deal |
| `r8-trader-deals-light-390-ar.png` | Mobile cards; bottom tabs; gutters OK |
| `r8-trader-deals-dark-*-ar.png` | Dark surfaces; same 4 rows; tools cream on dark |

### New `/trader/deals/new`

| File | what I SEE |
|------|------------|
| `r8-trader-deals-new-light-1440-ar.png` | Wizard step 1 «الطلب»; product picker + category chips |
| `r8-trader-deals-new-*-ar.png` | Same wizard chrome across viewports/themes; no dead primary |

### Detail `/trader/deals/[id]` (DL-DEMO-WAIT)

| File | what I SEE |
|------|------------|
| `r8-trader-deal-detail-light-1440-ar.png` | DetailHeader + 4-step Stepper + banner + KV + timeline + action form |
| `r8-trader-deal-detail-light-390-ar.png` | Stepper wraps; cards keep gutters; form above tabbar padding |
| `r8-trader-deal-detail-dark-*-ar.png` | Dark detail; stepper/negotiation intact |

## Honesty notes

- Tab counts can overlap (waiting ∩ negotiating): e.g. الكل 4 vs بانتظاري 3 + قيد التفاوض 1 + مغلقة 2 — filters are not a partition.
- Detail probe concatenates title+pill text without a space in plain `textContent`; visual gap via CSS `gap` is present.
- Demo deal refs (`DL-DEMO-*`) remain visible to the owning trader (by design after the list fix); admin lists still use `uiVisibleDealWhere()`.
- Owner still to swap «تحرير الأتيليه» offer image from admin when ready (content, not this branch).

## Next

Await written OK before Round 9 (wholesale / offers / notifications / account).
