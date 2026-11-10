# Phase 7 — Trader portal

Branch: `phase/07-trader`. Screens TRD-00 … TRD-06 (MASTER-BUILD-PLAN Part C5).
Mobile-first polish against design-lab for TRD-01 / TRD-04; real Prisma flows only.

## Quality gate

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npx next lint` on touched trader files | PASS |
| IDOR on detail routes | Existing scoped fetches: `getDealForTrader`, `getWholesaleRequestForTrader`, `getBrokerageForTrader` (session `traderId` in `where`) |

Videos on 390px of the three task flows: not recorded this pass (local agent) — owner review on device remains the acceptance check per BUILD-PLAN.

## Screen status

| ID | Route | Status | Notes |
|---|---|---|---|
| TRD-00 | shell / bottom tabs | Done | Pill width derived from tab count (fixes 6-vs-5 grid). Waiting badges: deals + wholesale + **brokerage**. |
| TRD-01 | `/trader` | Done | Photo task cards (brand assets); waiting includes brokerage + pulse; personal **open** counts (deals/wholesale/brokerage); offers strip with product/brand image; activity includes brokerage. No invented accept-rate. |
| TRD-02 | deals | Done (polish) | Autosave/review already present; **success celebration** overlay before navigate to detail. |
| TRD-03 | wholesale | Done (polish) | Product picker shows first `ProductImage` when present; sticky summary unchanged. |
| TRD-04 | brokerage | Done | **4-step wizard** + commission explainer; quote accept/reject via `ConfirmDialog`; copy in `dict.trader`. Detail gallery / quote / shipping already real. |
| TRD-05 | offers | Done | Dual CTAs (details + start deal); image from linked product when available. |
| TRD-06 | notifications / profile | Done (polish) | URL `?domain=` filters on notifications. Profile/security/sessions already present (no avatar/2FA fields). |

## Missing data sources (report only)

1. Offer hero without linked product — gradient/brand fallback only (`PublicCuratedOffer` has no image).
2. Accept-rate / monthly KPI columns — not on `TraderAccount`; home shows open counts instead.
3. 390px video artifacts — deferred to owner device pass / `artifacts/` (gitignored).

## REVIEW-LOG

**Pass 1:** Fixed bottom-tab math first (blocking on 390px). Wired brokerage into waiting counts + shell badges.

**Pass 2:** Brokerage wizard keeps `BrokeragePhotoField` mounted (CSS-hidden) so multipart photos survive steps 1–3. Quote actions call `traderRespondQuoteAction` after confirm (same pattern as wholesale).
