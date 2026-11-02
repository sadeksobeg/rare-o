# Phase 8 — Storefront

Branch: `phase/08-storefront`. Screens SF-01 … SF-12 (MASTER-BUILD-PLAN Part C6).
Owner approved temporary licensed/internet photography for layout until client assets arrive.

## Quality gate

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npx next lint` on PDP files | PASS |
| Seed with new instrument media | PASS (`npx prisma db seed`) |

Lighthouse / Slow-4G video suite: not recorded in this agent pass — owner device review still required per BUILD-PLAN.

## Temporary photography

`public/brand/instruments/` — Unsplash-sourced instrument atmosphere photos + `ATTRIBUTION.txt`.
Seed oud SKUs now attach 3–4 gallery frames (atelier PNG + instruments set). **Replace before production marketing claims.**

## Screen status

| ID | Route | Status | Notes |
|---|---|---|---|
| SF-01 | `/` | Done (existing + polish) | H1–H9 stack kept; editorial image → workshop instrument photo. |
| SF-02 | `/catalog` | Done (existing) | Sticky filters + mobile sheet already present. |
| SF-03 | `/product/[slug]` | **Done (Amazon-like)** | Vertical thumbs + hover zoom (desktop), buy box with trust rows, feature bullets, A+ craft modules, category crumb, sticky mobile CTA, related grid. No online payment. |
| SF-04–06 | cart / request / success | Done (existing) | In-flow success via request form (no separate `/success` route). |
| SF-07–08 | offers | Done (existing) | |
| SF-09–10 | contact / privacy | Done (existing) | |
| SF-11 | 404 / error | Done (existing); offline deferred | Same Phase 2 decision until SW. |
| SF-12 | search overlay | Done (existing) | |

## REVIEW-LOG

**Pass 1:** Prioritized SF-03 Amazon PDP: buy-box chrome, zoom lens, bullets from specs/description, A+ blocks using temporary instrument photos.

**Pass 2:** Reseeded gallery media; documented Unsplash attribution; avoided inventing ratings/reviews (no schema).
