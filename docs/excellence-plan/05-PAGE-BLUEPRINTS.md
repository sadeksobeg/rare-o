# WP4a — Page Experience Blueprints

## Coverage approach

`docs/ui-planning/plan/03-storefront-pages.md`, `04-admin-pages.md`, and `05-trader-pages.md` already specify every route in the structure this mission asks for (objective, hierarchy, layout, states, responsive behavior, accessibility, acceptance criteria) — written before implementation, as design intent. Reproducing all of it here would duplicate a signed document and risk drift.

This document instead does the thing not yet done: **verifies the locked blueprint against the actual, currently implemented code** for the two highest-priority surfaces named in this mission's brief (homepage, core commerce flow), and provides a route-to-blueprint index for everything else so no route is left unaccounted for.

---

## Verified blueprint — Homepage (`app/(storefront)/page.tsx`)

**User objective:** Establish brand/craft credibility in the first viewport; surface the clearest paths into the catalog, trader program, and request flow without demanding a decision immediately.

**Actual implemented structure (verified against source, not assumed):** a locked H1–H9 stack, explicitly labeled in the DOM (`data-home-block="H1"` … `"H9"`) for testability:

| Block | Component | Content | Empty-state handling (verified) |
|---|---|---|---|
| H1 | `HeroResonance` | Hero instrument image + headline + two CTAs (explore collection / contact) | N/A — always renders |
| H2 | `TrustStrip` | Craft/trust signals | N/A — static copy |
| H3 | Featured instrument section | One highlighted product | **Verified handled**: `{data.featuredInstrument ? (...) : null}` — the section is omitted entirely when there's no featured product, not rendered as an empty shell |
| H4 | `CategoryExplorer` | Category entry tiles | **Verified handled**: `{data.categories.length > 0 ? (...) : null}` — section omitted when zero categories |
| H5 | Offers (`OfferCard`) | Up to 3 curated offers, split featured + side | **Verified handled**: `{featuredOffer ? (...) : null}` — section omitted when no offers exist |
| H6 | `ProductGrid` (latest) | Up to 8 most recent products, excluding the featured one, with a fallback back to the unfiltered list if filtering empties it | **Verified handled**: `latestFallback = latest.length > 0 ? latest : data.latest.slice(0,8)` — explicit fallback logic against the empty-after-filter case |
| H7 | `EditorialSplit` | Brand story / craft narrative | Static, N/A |
| H8 | `HandoffExplainer` | 3-step WhatsApp handoff explainer | Static, N/A |
| H9 | `TraderBand` | Trader-program callout | Static, N/A |

**Real data dependency:** `getHomepageDiscoveryData()` (`lib/catalog/homepage.ts`) — single query aggregator, not per-block fetching (good for performance, matches the LCP work from Session 2).

**Main interactions:** scroll-reveal entrances (Session 1 motion system, tier A — "rich" per the locked plan), hero pointer-parallax (`HeroOudField`), add-to-request-list from product cards.

**Desktop/tablet/mobile:** verified via live browser crawl (Session 2) at 390/1440 — no horizontal overflow at either width; tablet (768) not re-verified this session, carried forward from the plan's responsive spec as unverified-but-designed-for.

**Accessibility:** verified this session — 0 axe violations (serious/critical) across AR/EN × 390/1440 for the home route specifically, as part of the 92-scan suite.

**Acceptance criteria (for any future change to this page):**
1. H1–H9 order and `data-home-block` labeling preserved (regression-testable).
2. Every conditional block (H3, H4, H5) has a verified, intentional empty/zero-data behavior — not a default empty shell.
3. `npm run test:d1-axe` stays at 0 serious/critical for the `home` route, both locales, both widths.
4. `npm run test:lh-budget` home LCP does not regress past the Session 2 baseline (see `PROJECT_AUDIT.md`).

All homepage conditional blocks (H3, H4, H5) are now confirmed to omit cleanly on zero data rather than rendering an empty shell — no outstanding flag on this page.

---

## Verified blueprint — Core commerce flow (Catalog → Product → Cart → Request)

**User objective:** Let a visitor go from browsing to a WhatsApp-ready request with price-on-request handled gracefully, in a flow with no payment step (contract clarification 4).

| Step | Route | Verified current state |
|---|---|---|
| Catalog | `/catalog` | Filter bar (type, price — matches contract clarification 1, no trader filter); confirmed live render clean, no console errors (Session 2 browser crawl) |
| Product detail | `/product/[slug]` | Gallery + oud-spec panel (Session 1 addition); `priority` image loading confirmed present on the first gallery image only (`components/storefront/product-gallery.tsx`) |
| Cart | `/cart` | Empty-state verified and fixed this initiative (Session 1–2: `role="status"` a11y fix on the pre-hydration placeholder) |
| Request | `/request` | Not re-verified live this session — carried forward from `FINAL-REPORT.md` row 2.5 (PASS) and Round F2's cache/revalidate work |

**Price-on-request handling (D6):** verified at both the schema level (`retailPrice`/`currency` both nullable) and the UI level — `dict.product.priceOnRequest` ("السعر عند الطلب" / "Price on request") is wired into `cart-view.tsx`, `product-card.tsx`, and `featured-instrument.tsx`. No outstanding flag.

---

## Route-to-blueprint index (everything else — no route left unspecified)

| Surface | Routes | Blueprint location |
|---|---|---|
| Storefront (remaining) | `/offers`, `/offers/[slug]`, `/contact`, `/privacy`, `/terms`, `/cookies` | `docs/ui-planning/plan/03-storefront-pages.md` |
| Trader | `/trader`, `/trader/deals`, `/trader/deals/new`, `/trader/deals/[id]`, `/trader/offers`, `/trader/wholesale`, `/trader/wholesale/[id]`, `/trader/notifications`, `/trader/profile`, `/trader/login` | `docs/ui-planning/plan/05-trader-pages.md` |
| Admin | `/admin`, `/admin/products*`, `/admin/categories`, `/admin/requests*`, `/admin/traders`, `/admin/deals*`, `/admin/wholesale*`, `/admin/customers*`, `/admin/inbox*`, `/admin/offers*`, `/admin/promos*`, `/admin/settings/security`, `/admin/login` | `docs/ui-planning/plan/04-admin-pages.md` |

Cross-cutting states (loading/empty/error/success/unavailable, desktop/tablet/mobile, a11y) for all of the above: `docs/ui-planning/plan/06-cross-cutting.md` §7–8 (state patterns + universal acceptance checklist). Not reproduced here to avoid a second, divergence-prone copy.
