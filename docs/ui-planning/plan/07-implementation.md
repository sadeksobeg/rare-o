# 07 — Implementation Plan

Baseline: git repository initialized by Stage C (`72a56a7`, then `033b0fd`). Work happens on one branch per phase (`ui/p1-foundations`, …), merged after the phase gate, tagged `ui-p{n}`.

**Dependency change (only one):** add `lucide-react`. Everything else uses the existing stack, native `<dialog>`, and the Popover API.

**Quality gate for every slice:** `npm run lint` · `tsc --noEmit` · `next build` · `scripts/check-i18n.ts` · the universal checklist (file 06 §8) · screenshots at 390 / 768 / 1440 in Arabic and English.

---

## Phase map

| Phase | Goal | Size (est. days, one reviewer) |
|---|---|---|
| P0 | Reconciliation, no UI change | 0.5 |
| P1 | Foundations: tokens, fonts, brand motifs, helpers, `/dev/ui` | 1–1.5 |
| P2 | Primitives and states, status mapping | 2–3 |
| P3 | Chrome, system pages, locale routing | 2–3 |
| P4 | Storefront (4 slices) | 5–7 |
| P5 | Admin (5 slices) | 6–8 |
| P6 | Trader portal (3 slices) | 3–4 |
| P7 | Hardening: SEO, performance, accessibility, cleanup | 2–3 |
| P8 | Client review pack and tag | 1 |

Estimates are for planning; the order and gates are binding.

---

## P0 — Reconciliation (read-only)

Produce `docs/ui-planning/plan/RECONCILIATION.md` before any code. Do **not** edit the plan files.

| Check | Output |
|---|---|
| Every route and file path named in files 03–05 exists or is flagged as new | Table: path, exists, note |
| Schema fields behind every column, form field, and `KeyValueList` in files 04–05 | Table: UI item → field, or MISSING |
| Enums for RetailRequest, DealProposal, WholesaleRequest, WhatsApp link and message states | Draft of `lib/ui/status.ts` (tone, labelKey, nextActor proposed) for owner approval |
| Data availability: `getDashboardCounts` coverage for the four KPIs, unread counts, activity feed source, WhatsApp connection state source, outbound-pause flag | Table: need → source or GAP |
| Image model: `ProductImage` fields (order, alt, primary), upload path, size limits | Notes |
| Middleware: where the locale rewrite and the 403 handling fit without touching JWT logic | Short design |
| Anything in the plan that contradicts a business boundary or the schema | Conflict list with a proposed minimal resolution |

Gate: owner reviews the conflict list; resolutions are recorded in `00-index.md` Decision Lock as D27+ entries.

---

## P1 — Foundations

| Action | Files |
|---|---|
| Replace fonts (Cormorant Garamond, Amiri, Source Sans 3, IBM Plex Sans Arabic); remove Noto families; set `lang`/`dir` | `app/layout.tsx` |
| Replace the `:root` block with the token block; add `.ro-inverse`, language type variables, motion keyframes, reduced-motion block; keep legacy aliases | `app/globals.css` |
| Create `Rings`, `Grain`, `Axis`, `Emblem` (PNG until A1 arrives) | `components/brand/*` |
| Create formatting, plural, href, nav, seo (skeleton), scroll helpers | `lib/i18n/format.ts`, `lib/i18n/plural.ts`, `lib/href.ts`, `lib/nav.ts`, `lib/seo.ts`, `lib/ui/scroll.ts` |
| Create the i18n parity script and wire it into lint | `scripts/check-i18n.ts` |
| Create the dev-only gallery (production: `notFound()`, `noindex`) | `app/dev/ui/page.tsx` |

Gate: gallery shows tokens, type scale, motifs, and contrast table in Arabic and English; owner confirms the two calibration variables (`--ro-display-scale`, `--ro-ui-scale`) after seeing Amiri and Plex Arabic rendered.

## P2 — Primitives and states

Create `components/ui/*` for P01–P24, the six brand glyphs, `lib/ui/status.ts` (approved table from P0), toast provider, `RoButton`/`RoButtonLink` as wrappers over `Button`. Every component appears in `/dev/ui` with all states, light and `.ro-inverse`, AR and EN.

Gate: owner approves the status table and the gallery. No page work starts before this gate.

## P3 — Chrome, system pages, routing

| Action | Files |
|---|---|
| Storefront chrome S01–S05, S24 | `components/storefront/header.tsx`, `footer.tsx`, `brand-mark.tsx`, `section-heading.tsx` (rewrite) |
| Admin shell A01 with dictionary labels | `components/admin/shell.tsx` |
| Trader shell T01 with dictionary labels | `components/trader/shell.tsx` |
| Locale rewrite for storefront `/en/*`; 403 handling; JWT logic untouched | `middleware.ts` |
| System pages: not-found, error, loading per group, 403, offline banner | `app/**/not-found.tsx`, `error.tsx`, `loading.tsx` |
| Admin and trader dictionary namespaces (nav, shell, auth) | `lib/i18n/dictionaries.ts` |

Gate: all three portals navigable in both locales; a trader opening an admin URL (and the reverse) sees the 403 view; the language switch maps to equivalent URLs.

---

## P4 — Storefront

| Slice | Scope | Closes |
|---|---|---|
| **4a** | `ProductCard`, `ProductGrid`, `FilterBar`, `PriceBlock`, `AvailabilityChip`, `MaterialPlate`, Catalog (SF-02), `ProductGallery`, `SpecTable`, PDP (SF-03) | Audit finding R1 (missing product images) |
| **4b** | `QtyStepper`, `RequestLine`, `HandoffExplainer`, `RequestSummary`, `RequestForm`, `HandoffSuccess`, Request list (SF-04), Request (SF-05) | R9 (hard-coded English) |
| **4c** | `HeroResonance`, `TrustStrip`, `EditorialSplit`, `TraderBand`, Home (SF-01), `SearchOverlay`, `QuickView` | R5 (dead home modules) |
| **4d** | Offers (SF-06/07), Contact (SF-08), Privacy (SF-09) | — |

Review gate after **each** slice with the screenshot matrix.

## P5 — Admin

| Slice | Scope |
|---|---|
| 5a | Login, Dashboard (AD-01, AD-02) |
| 5b | Inbox (AD-03) with all connection and message states |
| 5c | Requests, Deals, Wholesale (AD-04 to AD-06) |
| 5d | Products with `ImageUploader`, Categories, Offers (AD-07 to AD-09) |
| 5e | Customers, Traders (AD-10, AD-11) |

## P6 — Trader portal

| Slice | Scope |
|---|---|
| 6a | Login, Home, Offers, Profile (TR-01, TR-02, TR-09, TR-10) |
| 6b | Deals list, wizard, detail (TR-03 to TR-05) |
| 6c | Wholesale builder, list, detail (TR-06 to TR-08) |

---

## P7 — Hardening and cleanup

| Action | Detail |
|---|---|
| SEO | `lib/seo.ts` complete, metadata per page, `sitemap.ts`, `robots.ts`, JSON-LD, OG images, hreflang |
| Performance | Lighthouse runs (Slow 4G, mobile) on Home, Catalog, PDP, Request; fix to budget |
| Accessibility | axe pass on every route; NVDA and VoiceOver on the five flows (file 06 §4) |
| Cleanup | Delete: `components/storefront/home/{discovery,categories,featured-products}.tsx`, unreferenced `media-plane` and `material-field`, template SVGs in `public/` (`next.svg`, `globe.svg`, `file.svg`, `vercel.svg`, `window.svg`), legacy color aliases and old gradients. Compare stays dormant behind a flag |
| Brand | Replace PNG marks with SVG when A1 and A2 arrive; favicon set and default OG image (A3, A4) |
| Final | `scripts/check-i18n.ts` clean; no hard-coded strings, hex, or arbitrary type sizes (grep counts reported at zero) |

## P8 — Review pack

Screenshot matrix for every P0 screen (390 / 768 / 1440 × AR / EN), a 10-minute walkthrough script (visitor request → admin handling → trader deal → wholesale), the known-issues list, Lighthouse reports, tag `ui-v1.0`.

---

## File map (existing → action)

| Existing | Action | Phase |
|---|---|---|
| `app/layout.tsx` | Fonts, `lang`/`dir`, skip link | P1, P3 |
| `app/globals.css` | Token block, motion, remove gradients and hex | P1 |
| `components/ui/ro-button.tsx` | Wrapper over new `Button` | P2 |
| `components/storefront/{header,footer,brand-mark,section-heading}.tsx` | Rewrite | P3 |
| `components/storefront/home/hero.tsx` | Rewrite as `HeroResonance` | P4c |
| `components/storefront/home/{discovery,categories,featured-products}.tsx` | Delete | P7 |
| `components/storefront/discovery/*` | Keep search overlay and quick view (restyle); compare behind flag; mosaic and rail replaced by H3–H6 | P4c |
| `components/storefront/cart-provider.tsx` | Keep logic; labels from dictionary | P4b |
| `components/storefront/request-form.tsx` | Rewrite (S17) | P4b |
| `components/storefront/product-card.tsx` | Replace with S06 | P4a |
| `app/(storefront)/**` | Restyle per file 03; add contact, privacy, system pages | P4 |
| `components/admin/shell.tsx`, `app/admin/**` | Rewrite and restyle per file 04 | P3, P5 |
| `components/trader/shell.tsx`, `app/trader/**` | Rewrite and restyle per file 05 | P3, P6 |
| `components/deals/negotiation-form.tsx` | Becomes `NegotiationThread` action bar (A19) | P5c, P6b |
| `middleware.ts` | Add locale rewrite and 403 handling | P3 |
| `lib/i18n/*` | Namespaces, plural, format | P1, P3 |
| New: `components/brand/*`, `components/ui/*`, `lib/ui/status.ts`, `lib/href.ts`, `lib/nav.ts`, `lib/seo.ts`, `lib/ui/scroll.ts`, `scripts/check-i18n.ts`, `app/dev/ui/page.tsx`, `app/sitemap.ts`, `app/robots.ts` | Create | P1–P7 |

---

## Risk register

| # | Risk | Mitigation |
|---|---|---|
| R1 | Arabic font metrics clip or look small next to Latin | Two calibration variables only; reviewed in `/dev/ui` at P1 |
| R2 | Locale URL change breaks existing links | `lib/href.ts` for all links; P0 design; redirect map; tested in P3 |
| R3 | Few real photos make the store look empty | Material Plate system; sections hide when data is absent; photography brief A5/A6 |
| R4 | Inbox depends on connection and pause state that may not be exposed to the UI | P0 checks the source; if missing, a minimal read-only status endpoint is the single permitted backend addition, approved in P0 |
| R5 | Hero too heavy on weak networks | Save-Data mode, image budget, no video, static fallback |
| R6 | Scope creep (compare, new features, new fields) | Decision Lock and change policy in file 00; Cursor reports instead of adding |
| R7 | SVG logo not delivered | PNG remains valid; A1 gates only the final polish |
| R8 | Reviewer bandwidth | Gates are per slice; each slice ships a screenshot matrix so review is visual and fast |
| R9 | Schema lacks a field a screen needs | P0 conflict list; screens simplify instead of inventing fields |

---

## Cursor prompts

### A. Master implementation prompt (paste once)

```
ROLE
You are the Principal Frontend Engineer implementing the locked UI plan for
Project B (D:\N I G H T\rare-oud-platform). The plan is in
docs/ui-planning/plan/ (files 00 to 07). It is the source of truth.

RULES
- Read all eight plan files before doing anything. Do not edit them.
- Work strictly phase by phase and slice by slice (file 07). Stop at every
  gate and wait for my explicit approval.
- Phase 0 first: produce RECONCILIATION.md, no code.
- Follow the Decision Lock (file 00). Anything outside it: ask, do not decide.
- Add no dependency except lucide-react. Use native <dialog> and Popover API.
- Never invent fields, statuses, routes, features, prices, MOQ, discounts, or
  shipping rates. If the schema lacks something, report it.
- Business boundaries stay binding: no payment, traders own nothing, three
  separate domains, no generic Order, WhatsApp via the Baileys adapter only.
- Every string from the dictionary (AR and EN). Every color, size, and space
  from tokens. Logical CSS properties only.
- Do not touch Project A. Do not change backend logic except where a slice
  explicitly says so.
- After each slice report: files changed, checklist results (file 06 §8),
  screenshots to capture, open issues. Then stop.

Confirm you have read the plan, then begin Phase 0.
```

### B. Phase kickoff template

```
START PHASE {N} — {NAME}
Scope: the slices listed for this phase in file 07, and only those.
Specs: {files and section ids}.
Gate criteria: as written for this phase.
Run the quality gate for every slice. Report using the slice report format,
then stop and wait.
```
