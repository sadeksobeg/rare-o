# WP4b — Visual Prototypes & Review Index

## How to review

1. **Current-state evidence (homepage + core commerce flow, prioritized per this mission's brief):** these are not separate mockups. The homepage and catalog already implement the locked design system faithfully — building a parallel static mockup of something already correctly built and running would be wasteful and risks drifting from the real implementation. Instead, this session captured and visually verified the live application directly:
   - Homepage, desktop 1440×900, Arabic (default locale) — hero, nav, instrument photography, RTL-correct right-aligned logo/nav.
   - Homepage, mobile 375×812, Arabic — confirms hero and nav collapse correctly, no horizontal overflow (re-confirmed Session 2).
   - Catalog, desktop 1440×900, Arabic — filter bar (type + price only, matching contract clarification 1), category tier tiles, product cards with status badges.
   - Trader login, desktop, Arabic — confirms admin-only account creation messaging (contract clarification 2) is correctly surfaced to a visitor with no account.
   
   All four were captured live this session and are visible in this conversation's transcript. **To reproduce them yourself:** `npm run dev`, visit `http://localhost:3000/` (Arabic default) and `http://localhost:3000/en` (English), at 375px and 1440px widths. This is more useful for actual review than static images, because you can interact with it.

2. **New prototype (the one proposed refinement from WP3):** `docs/excellence-plan/prototypes/ro-list-card-unification.html` — a standalone, isolated static HTML file. Not wired to any route, any data fetch, or any app code. Open it directly in a browser (double-click, or `file://` URL) — no dev server required. Demonstrates the proposed single `RoListCard` anatomy (media / title / meta / status tag / action) applied to all four contexts that currently have separate implementations: catalog product, trader deal, wholesale request, admin retail request — in both Arabic/RTL and English/LTR, using the three approved brand colors exactly (`#0B080D`, `#32104F`, `#F4E7D8`) and real dictionary strings (no invented commercial content).

## What was intentionally NOT built as a new prototype, and why

- **A new homepage/catalog mockup** — would duplicate already-approved, already-implemented, already-verified-clean work. WP2's research confirmed the existing direction is correct; there is no new direction to prototype.
- **Admin and wholesale full-page mockups** — out of priority order per this mission's own instruction ("prioritizing the homepage and core commerce flow, followed by trader, wholesale, and admin"). The one concrete design change that touches all of them (card unification) is prototyped; a full-page mockup of unchanged admin/wholesale layouts would add review burden without new information. If the owner wants dedicated admin/wholesale visual prototypes before WP9's implementation, that is a one-line request away and is already scoped as a sub-task of WP4 in the roadmap.

## Limitation statement (per this mission's explicit instruction to state limitations honestly)

This environment cannot export the live browser pane's screenshots as standalone image files into the repository — they exist as inline results in this conversation, not as files on disk. The isolated HTML prototype, by contrast, **is** a real repo file and can be screenshotted, re-opened, or handed to a designer independently of this conversation. Where a persistent image artifact is specifically required (e.g., for a design handoff deck), the strongest available alternative is: open the dev server or the static HTML file locally and capture screenshots through the OS or browser's own tools — a five-minute task, not a tooling gap worth working around with a lower-fidelity substitute.

## Catalog sparsity note

The live catalog shown in the current-state screenshots has real seeded products (ouds across economy/mid/professional/VIP tiers from the Session 1 schema migration, plus accessories) — not an empty state. A dedicated empty/low-data state was not separately prototyped this session because it is not the current reality and prototyping a hypothetical empty state risks looking like a claim about a problem that doesn't exist. If the owner wants the zero-product and zero-category empty states specifically reviewed, `app/(storefront)/page.tsx`'s verified conditional-omission logic (see `05-PAGE-BLUEPRINTS.md`) already handles them — a live demonstration (temporarily filtering the dev database) can be arranged as a scoped WP4 follow-up.
