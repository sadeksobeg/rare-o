# Round 9 — Wholesale / brokerage / offers / notifications / account

**Stop here for written approval.** No deploy. No merge to main until the owner approves in chat. Shipping phase 2 stays blocked until after trader UI merge (owner note).

Branch: `ui/trader-r9` (from `ui/trader-r8`, separate from shipping). Constraints held: no deploy, no WhatsApp/schema/contract changes, no IDOR surface changes beyond matching R8’s “trader always sees own rows” list visibility.

## FIRST commit — R8 leftover fixes (before → after)

Preamble commit: `7b4ed13`.

| # | Before | After |
|---|--------|-------|
| 1 | Status tabs overlapped (accepted/awaiting_payment counted in «مغلقة» and «بانتظاري»); counts did not sum to «الكل» | True partition: `all` / open / payment / done; «بانتظارك» is a separate warn-styled action chip (`?waiting=1`); counts match filtered rows |
| 2 | 768/390 FAB covered last row title; 390 had header CTA + FAB | Bottom padding = tabbar + FAB + safe-area; header CTA `≥901px`, FAB `≤900px` only |
| 3 | Table lacked date/amount; «الإدخالات» vague/wide | Columns: «آخر تحديث» + amount; messages column renamed «الرسائل»; tighter layout; mobile cards show date + amount |
| 4 | KeyValue left half empty; «رقم الموديل —» floated; «الملخص التجاري» duplicated inside same card | Empty fields omitted; grid fills; card field renamed «الإجمالي» (`dealTotal`) |
| 5 | Negotiation body ellipsized at 390; empty «الشروط ·» chip | `whitespace-pre-wrap` / `break-words`; chips only when value present |
| 6 | Send control stacked icon-over-label at 1440; «إرسال الإدخال» | `inline-flex flex-row`; label «إرسال الرد» |
| 7 | DetailStepper ≤480 became 2×2 (~120px) without connectors | Compact single row: current step + `n/N` progress |
| 8 | New-deal picker: 12 tall cards before message; bare «—» image | Compact searchable list `max-h ~46vh`; selected product → removable chip; `ImageOff` neutral placeholder |

## Round 9 scope

Restyle vs `trader-wholesale.html` / `trader-account.html` chrome (ui-kit), same gates as R8:

| Route | Notes |
|-------|--------|
| `/trader/wholesale/requests` | SegControl partition + waiting chip; `WholesaleTable`; FAB when rows exist |
| `/trader/wholesale` | New request form (picker already compact from R8) |
| `/trader/wholesale/[id]` | `DetailBack` / `DetailHeader` / `DetailStepper` / cards |
| `/trader/brokerage` | Hero strip + card list (stats are summary chips, not filter tabs) |
| `/trader/brokerage/[id]` | Detail + lifecycle rail (`rad-br-rail-scroll`, focusable) |
| `/trader/offers` | Grid/cards; both CTAs live |
| `/trader/notifications` | Status center list + tabs |
| `/trader/profile` | Account / prefs / password / sessions |

### Extra fix found during R9 gates (not in R8 list)

- `listWholesaleRequestsForTrader` had been filtering with `uiVisibleWholesaleWhere()`, so the trader list showed **empty** while detail `WH-2026-3027` still loaded by id. Aligned with R8 deals: **trader always sees own requests**; admin lists keep the hide filter.
- Brokerage lifecycle rail: axe `scrollable-region-focusable` at 390 — dedicated `.rad-br-rail-scroll` (always clips; not broken by DetailStepper phone `overflow: visible`).

## Files touched in Round 9 (exact)

```
app/trader/(protected)/brokerage/page.tsx
app/trader/(protected)/notifications/page.tsx
app/trader/(protected)/offers/[slug]/page.tsx
app/trader/(protected)/offers/page.tsx
app/trader/(protected)/profile/page.tsx
app/trader/(protected)/wholesale/[id]/page.tsx
app/trader/(protected)/wholesale/page.tsx
app/trader/(protected)/wholesale/requests/page.tsx
components/brokerage/lifecycle-rail.tsx
components/trader/wholesale-table.tsx          (new)
lib/wholesale/service.ts
styles/ui-kit.css
scripts/pilot-trader-r9-shots.mjs
docs/ui/pilot-trader/R9-REPORT.md
docs/ui/pilot-trader/r9-shots.json
docs/ui/pilot-trader/r9-trader-*.png          (64)
```

Wholesale markup kept componentized (`WholesaleTable`, ui-kit Detail\*, SegControl via `DealsFilterTabs`) for the shipping branch’s later quote tool / shipping selector.

## Gates

Script: `scripts/pilot-trader-r9-shots.mjs` → `docs/ui/pilot-trader/r9-shots.json` (64 shots: dark+light × 1440/1280/768/390 × 8 surfaces).

| Gate | Result |
|------|--------|
| Horizontal overflow (doc + cards) | **0 fails** |
| Console errors | **0** |
| axe wcag2a/2aa | **0** |
| `ro-portal-*` on shot DOM | **0** |
| `tsc --noEmit` | pass |
| lint (touched) | pass |

## SEND screenshots — what I SEE

### Wholesale requests `/trader/wholesale/requests`

| File | what I SEE |
|------|------------|
| `r9-trader-ws-requests-light-1440-ar.png` | Seg الكل 3 / مفتوحة+مغلقة partition; «بانتظارك» chip separate; DataTable 3 rows (ref/mode/status/lines/آخر تحديث); +طلب جديد in header |
| `r9-trader-ws-requests-light-390-ar.png` | Mobile cards + date; FAB +; partition counts sum to الكل; bottom padding under list for tabbar+FAB |
| `r9-trader-ws-requests-dark-*-ar.png` | Same structure on dark surfaces |

### Wholesale new `/trader/wholesale`

| File | what I SEE |
|------|------------|
| `r9-trader-ws-new-light-1440-ar.png` | Request mode select; search + category chips; product cards with Add; sticky «0 قطعة · مراجعة وإرسال» disabled |
| `r9-trader-ws-new-light-390-ar.png` | Stacked form; 2-col product grid; tabbar clear; local catalog images include DJ/radio placeholders (local seed, not Cursor art) |
| `r9-trader-ws-new-dark-*-ar.png` | Dark chrome; same actions |

### Wholesale detail `/trader/wholesale/[id]` (WH-2026-3027)

| File | what I SEE |
|------|------------|
| `r9-trader-ws-detail-light-1440-ar.png` | DetailHeader + 5-step stepper all done; quote card USD 150; lines + log; «لا إجراءات» for completed |
| `r9-trader-ws-detail-light-390-ar.png` | Compact stepper `5/5 مكتمل`; cards stacked; no dead primary |
| `r9-trader-ws-detail-dark-*-ar.png` | Dark detail intact |

### Brokerage list `/trader/brokerage`

| File | what I SEE |
|------|------------|
| `r9-trader-brokerage-light-1440-ar.png` | Hero + 3 request cards; stats الكل 3 / قيد المتابعة / ينتظرك / مغلق; «+ طلب وساطة» live |
| `r9-trader-brokerage-light-390-ar.png` | Stacked cards; tabbar; needs-you row highlighted when present |
| `r9-trader-brokerage-dark-*-ar.png` | Dark hero/cards |

### Brokerage detail `/trader/brokerage/[id]` (BR-2026-8258)

| File | what I SEE |
|------|------------|
| `r9-trader-brokerage-detail-light-1440-ar.png` | Closed header; phase chips; horizontal lifecycle rail; Aramex tracking; timeline |
| `r9-trader-brokerage-detail-light-390-ar.png` | Rail scrolls horizontally inside focusable region; empty model/price still show «—» (not deals KV hide); timeline readable |
| `r9-trader-brokerage-detail-dark-*-ar.png` | Dark lifecycle + timeline |

### Offers `/trader/offers`

| File | what I SEE |
|------|------------|
| `r9-trader-offers-light-1440-ar.png` | 2 offer cards; «بدء صفقة» + «التفاصيل» both live; Atelier image is trumpet (owner content) |
| `r9-trader-offers-light-390-ar.png` | Stacked cards; CTAs ≥44px; tabbar clear |
| `r9-trader-offers-dark-*-ar.png` | Dark cards |

### Notifications `/trader/notifications`

| File | what I SEE |
|------|------------|
| `r9-trader-notifications-light-1440-ar.png` | Tabs الكل 108 / وساطة 108; dated cards with «فتح»; «عرض المزيد» |
| `r9-trader-notifications-light-390-ar.png` | Same list density; no H-overflow |
| `r9-trader-notifications-dark-*-ar.png` | Dark status center |

### Account `/trader/profile`

| File | what I SEE |
|------|------------|
| `r9-trader-profile-light-1440-ar.png` | Theme + language; identity card; prefs checkboxes + حفظ; password form; sessions logout-others |
| `r9-trader-profile-light-390-ar.png` | Stacked cards; حفظ التفضيلات live; تحديث كلمة المرور disabled until filled |
| `r9-trader-profile-dark-*-ar.png` | Dark account chrome |

## Honesty notes

- Brokerage **hero stats** are not a filter partition: «ينتظرك» overlaps «قيد المتابعة»; `inFlight + closed = الكل` only if you ignore needs-you. Deals/wholesale lists use true SegControl partitions.
- Brokerage detail still renders empty «رقم الموديل / السعر» as «—» (deals R8 hide-empty was not applied here).
- Wholesale/new catalog photos (DJ deck, radio, etc.) are **local seed media**, not agent-generated; owner replaces on prod if those assets ship.
- Atelier offer trumpet image remains owner content (same as R8 note).
- Notifications volume (108 brokerage) is demo noise; UI paging via «عرض المزيد» works.
- 390 wholesale list: FAB + increased bottom padding; if a viewport still looks tight over the last badge in a static shot, scroll clearance is the intended fix (same pattern as deals R8).

## Next (owner)

1. Written OK on Round 9.
2. Merge trader UI branch into main (**no deploy**).
3. Then shipping phase 2 may touch wholesale pages without fighting this restyle.
