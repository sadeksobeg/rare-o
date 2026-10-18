# Owner / client asset deliverables (remaining)

**Date:** 2026-10-18  
**Project:** RARE OUD platform (`rare-oud-platform`)  
**Spec references:** [01-foundations §10](../ui-planning/plan/01-foundations.md), [04-brand-aligned visual design](../week-1/04-brand-aligned-visual-design.md), [FINAL-QA.md PL04–PL05](../ui-planning/plan/FINAL-QA.md)

The app runs with **PNG marks**, **editorial stand-ins**, and **placeholder privacy copy**. Launch polish and legal readiness depend on the items below.

---

## Summary checklist

| ID | Asset | Status in repo | Blocks |
|----|--------|----------------|--------|
| A1 | Emblem SVG set | **Missing** — `public/brand/mark-*.png` via `components/brand/emblem.tsx` | Final logo crispness, favicon source |
| A2 | Latin wordmark SVG | **Missing** | Header/hero lockups |
| A3 | Favicon + touch icons | **Partial / unverified** | Browser tab, PWA bookmark |
| A4 | Default OG image 1200×630 | **Open** | Social share cards |
| A5 | Editorial photography (§10.2) | **Partial** — some `public/brand/editorial*` + atmosphere SVGs | Home/editorial sections |
| A6 | Product photography per SKU (§10.1) | **Partial** — many SKUs use shared editorial/atelier assets | Catalog credibility |
| A7 | Grain / rings / axis | **Built** — `components/brand/*` | — |
| Legal | Privacy policy AR + EN | **PLACEHOLDER** — `lib/i18n/dictionaries.ts` → `privacy.*` | SF-09 launch |
| Legal | Contact / hours copy | **Review** — `lib/config/contact.ts` + dictionaries | SF-08 accuracy |

---

## A1 — Emblem SVG (master, ink, cream, plum, small mark)

**Why:** D26 / plan 01 §10.4 — vector marks replace PNG for all densities.

**Owner steps:**

1. Export from master brand file: emblem only, **no effects**, sRGB.
2. Deliver five SVGs (or one SVG + CSS variants if agreed):
   - `mark-master.svg` (cream on ink)
   - `mark-ink.svg` (ink on cream)
   - `mark-plum.svg` (plum on cream)
   - `mark-small.svg` (≤32px usage)
   - Optional monochrome for print
3. Confirm clear-space rule: 25% emblem height minimum.
4. Hand off via secure channel (not git if NDA); dev replaces paths in `components/brand/emblem.tsx` and `components/storefront/brand-mark.tsx`.

**Acceptance:** Renders at 24px and 96px without blur; matches approved PNG reference.

---

## A2 — Latin wordmark lockup “RARE OUD” SVG

**Owner steps:**

1. Provide horizontal lockup SVG aligned to emblem cap height.
2. Specify minimum width and spacing to emblem when combined.
3. Approve usage on cream (`--ro-cream`) and ink inverse surfaces.

**Acceptance:** Used in storefront header without raster fallback.

---

## A3 — Favicon set

**Owner steps:**

1. From A1 small mark, export: `favicon.ico` (16/32), `icon.svg`, `apple-touch-icon.png` (180), `icon-512.png`.
2. Confirm safe zone on plum or ink background.

**Dev handoff:** Place under `app/` / `public/` per Next.js metadata conventions; update `app/layout.tsx` metadata.

---

## A4 — Default Open Graph image

**Owner steps:**

1. Supply 1200×630 JPG or PNG: brand mark + one approved editorial frame (no busy text).
2. Approve Arabic and English title safe zones for automated OG titles.

**Dev handoff:** Wire in `lib/seo.ts` / layout defaults.

---

## A5 — Editorial photography set (minimum 6)

**Spec:** Plan 01 §10.2 — wood grain ×2, rosette, hands crafting, strings/pegs, workshop/material.

**Owner steps:**

1. Shoot or license per spec (soft light, no flash-sale aesthetic).
2. Deliver masters at least 2400px long edge, JPEG q≥90, sRGB.
3. Name files per shot type (e.g. `editorial-rosette-01.jpg`).
4. Provide AR/EN alt text per image.

**Dev handoff:** Add to `public/brand/editorial/` and register in `lib/brand/editorial.ts` (if used).

---

## A6 — Product photography (per published SKU)

**Spec:** Plan 01 §10.1 — 4:5, minimum 3 angles per SKU, `{slug}-{n}.jpg`.

**Owner steps:**

1. Prioritize **published** catalog slugs (check admin → Products → status published).
2. For each SKU deliver at least: three-quarter front, soundboard/rosette macro, back/grain.
3. Background: seamless ink-900 primary; sand-100 only if collection requires.
4. Supply alt text AR/EN per angle.

**Dev handoff:** Upload via admin **ImageUploader** on each product; retire Material Plate when ≥1 real image validates publish rules.

**Current gap note:** Client evidence doc reports shared editorial stand-ins for multiple SKUs — replace incrementally by SKU.

---

## Privacy policy text (AR + EN)

**Why:** SF-09 shows `placeholderBanner` and `[PLACEHOLDER]` section bodies until replaced.

**Owner steps:**

1. Legal counsel drafts: data collected (request form, WhatsApp), purpose, retention, contact, cookies if any, international transfers if applicable.
2. Provide **final Arabic** and **English** prose (not machine-translated without review).
3. Specify effective date and contact email/phone for privacy inquiries.

**Dev handoff:**

1. Replace strings under `privacy` in `lib/i18n/dictionaries.ts` (both `ar` and `en` trees).
2. Remove or hide `placeholderBanner` once live copy is approved.
3. Smoke-test `/privacy` and `/en/privacy` (sticky TOC, section anchors).

---

## Contact & business identity copy

**Owner steps:**

1. Confirm hours, WhatsApp business number, email, physical address (if shown), response-time expectation.
2. Confirm Arabic and English wording for “curated offers” and trader access link tone.

**Dev handoff:** Update `lib/config/contact.ts` and related dictionary keys; verify `/contact`.

---

## Typography (optional A-TYPO)

If a licensed brand typeface exists beyond current web fonts (Cormorant, Amiri, Source Sans 3, IBM Plex Sans Arabic in `app/layout.tsx`):

1. Provide WOFF2 files + license proof.
2. Document which role replaces display vs UI.

Otherwise: **confirm in writing** that current Google/local fonts are approved for launch.

---

## Delivery packaging (recommended)

One folder per drop:

```text
owner-handoff-YYYY-MM-DD/
├── logo-svg/
├── favicon-og/
├── editorial/
├── products/{slug}/
├── legal/privacy-ar.md privacy-en.md
└── contact/contact-facts.md
```

Email or drive link to dev; **do not commit** unreleased high-res masters if contract restricts.

---

## After owner delivery (dev verification)

1. Replace PNG logo paths and run visual pass on header, login, inverse admin login.
2. Re-publish one product with new photos; confirm catalog + PDP + sitemap.
3. Legal review sign-off on privacy pages archived in project records.
4. Update [CONFORMANCE.md](../ui-planning/plan/CONFORMANCE.md) and [FINAL-QA.md](../ui-planning/plan/FINAL-QA.md) deferred items when complete.
