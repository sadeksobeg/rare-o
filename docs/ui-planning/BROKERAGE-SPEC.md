# Brokerage (الوساطة) — build spec

Owner-approved in `VISION.md` §7. Fourth commercial domain — separate from retail / deals / wholesale. No online payment.

## Models

- `BrokerageRequest` — trader-owned request + lifecycle status
- `BrokerageInspection` — optional 1:1 report (grade, notes, verdict, photo paths JSON)
- `BrokerageQuote` — goods value, commission rate 1–2%, shipping, validity
- `BrokerageEvent` — append-only timeline

## Status lifecycle

`SUBMITTED` → `NEEDS_INFO` | `ACCEPTED` → `INSPECTION_SCHEDULED` → `INSPECTED` → `QUOTE_SENT` → `APPROVED` → `PURCHASED` → `SHIPPED` → `DELIVERED` → `CLOSED`

Terminal: `DECLINED` (admin), `REJECTED` (trader declines quote), `CANCELLED`.

## Permissions

- Trader: CRUD own requests only; approve/reject quote when `QUOTE_SENT`.
- Admin: all transitions valid for current status; schedule inspection; write report; send quote; purchase/ship.

## Routes

- Trader: `/trader/brokerage`, `/trader/brokerage/new`, `/trader/brokerage/[id]`
- Admin: `/admin/brokerage`, `/admin/brokerage/[id]`

## Dictionary keys (AR/EN)

Two separate sources hold brokerage copy — neither is a flat lookup table, so this section
maps what exists rather than inventing a new shared schema.

### 1. Status/phase copy — `components/brokerage/labels.ts`

Per-status metadata (`BROKERAGE_STATUS_META`), keyed by `BrokerageStatus`, each entry holding
`{ ar, en }` pairs directly (no separate dictionary file). Covers all 14 statuses in
`BROKERAGE_STATUSES`: `SUBMITTED`, `NEEDS_INFO`, `ACCEPTED`, `INSPECTION_SCHEDULED`,
`INSPECTED`, `QUOTE_SENT`, `APPROVED`, `PURCHASED`, `SHIPPED`, `DELIVERED`, `CLOSED`,
`DECLINED`, `REJECTED`, `CANCELLED`.

| Field | Shape | Consumed via |
|---|---|---|
| `label` | `{ar, en}` | `brokerageStatusLabel(status, locale)` |
| `phase` | one of `intake/inspection/quote/fulfillment/closed` | `brokeragePhaseLabel(phase, locale)` (labels in `BROKERAGE_PHASE_LABEL`) |
| `meaning` | `{ar, en}` — one-line status explanation | `brokerageMeaning(status, locale)` |
| `nextHint.admin` / `nextHint.trader` | `{ar, en}` — audience-specific "what happens next" | `brokerageNextHint(status, locale, audience)` |
| `side` | `boolean` (terminal/side-path, excluded from the happy-path rail) | `BrokerageLifecycleRail` |

`brokerageActorLabel(status, locale)` derives "Admin"/"Trader"/"Done" from `nextActor()` in
`lib/brokerage/status.ts` rather than from a dictionary entry.

### 2. Nav/task-card copy — `lib/i18n/dictionaries.ts`

Flat `{ar, en}` string pairs inside the app's general locale dictionaries (admin nav, trader
nav, trader dashboard):

| Key | AR | EN | Used in |
|---|---|---|---|
| `brokerage` (admin nav) | الوساطة | Brokerage | admin sidebar label |
| `kpiBrokerage` | وساطة نشطة | Active brokerage | admin dashboard KPI tile |
| `brokerage` (trader nav) | الوساطة | Brokerage | trader sidebar label |
| `newBrokerage` | طلب وساطة | New brokerage | trader "new request" CTA |
| `taskBrokerageTitle` | اطلب وساطة | Request brokerage | trader dashboard task card |
| `taskBrokerageBody` | رأينا قطعة؟ نعاينها ونرسل عرضاً قبل الشراء. | Saw a piece? We inspect and quote before purchase. | trader dashboard task card |

### Screen-local strings

The six brokerage screens (`app/admin/(protected)/brokerage/**`,
`app/trader/(protected)/brokerage/**`) and their components (`hero-strip.tsx`,
`photo-gallery.tsx`, `status-brief.tsx`, `timeline.tsx`, quote/needs-info action components)
hold their remaining field labels, button text, and empty states as inline
`ar ? "…" : "…"` ternaries keyed off the request locale, not in either dictionary above. This
matches the rest of the admin/trader portal's current pattern (see `01_DESIGN_SYSTEM.md`) and
is not a gap — flagged here only so a future dictionary consolidation knows where to look.
