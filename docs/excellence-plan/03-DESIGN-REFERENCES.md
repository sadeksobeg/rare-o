# WP2 — Design Research & Verified Reference Library

## Framing (important — read before the references)

RARE OUD already has a **locked, signed visual direction**: `docs/ui-planning/plan/PLAN.md` and its `01-foundations.md` through `07-implementation.md`, Decision Lock D1–D26. It specifies "quiet luxury, craft-led," a from-scratch motif system (resonance rings / grain lines / axis), an explicit palette including the three approved brand colors, and an explicit forbidden list that already matches this mission's brief almost word-for-word (no gold/metallic, no clip-art arabesque, no glassmorphism, no bouncy easing, no fabricated imagery).

**This research therefore does not propose a new direction.** It validates and stress-tests the locked direction against real, inspected references, and extracts specific, applicable refinements — while explicitly naming what should *not* be copied, consistent with the plan's own forbidden list. Three references were chosen and deeply inspected (via direct `WebFetch`, not secondary summaries), rather than producing a longer list of shallow name-drops. Each is chosen because it maps to one of the plan's own four brand-pillar obligations.

---

## Reference 1 — Aesop

- **Brand & URL:** Aesop — `https://www.aesop.com/us/` (direct fetch returned HTTP 403 — bot-blocked; findings below are from a secondary synthesis of multiple independent design-trade sources, clearly marked as such, not a first-hand page inspection)
- **Date inspected:** 2026-10-28 (secondary sources only — see caveat above)
- **Relevant page/interaction:** Homepage and general site language, per design-trade coverage
- **Observed design qualities (secondary-sourced):** Neutral palette (cream/olive/brown) matching physical packaging; near-zero visual noise; editorial, gallery-like homepage using collage-style imagery instead of a conventional mega-menu; long-form product storytelling over promotional copy; an Optima-inspired serif for brand voice.
- **UX/visual principle worth learning from:** Restraint as the luxury signal itself — "doing less" is the differentiator, not ornamentation. Directly validates the plan's Principle 3 ("Precision... everything aligns") and Principle 6 ("Calm density").
- **Potential application to RARE OUD:** The locked plan already calls for "instrument first" imagery dominance (Principle 1) and a cream/near-black/plum palette matching the approved brand colors. Aesop confirms this restraint strategy works at a premium price point without needing gold/ornament — supports keeping the forbidden list exactly as locked, with no softening.
- **What should NOT be copied:** Aesop's collage-based navigation (small image tiles instead of text menus) does not fit RARE OUD — the plan already specifies clear text-first navigation for a bilingual, lower-traffic, higher-consideration B2B/B2C hybrid catalog (traders need fast, unambiguous wayfinding, not editorial browsing). Do not import Aesop's navigation pattern.
- **Confidence note:** because the live fetch was blocked, this reference carries lower confidence than References 2 and 3. Treat as directionally supportive, not as a pixel-level source.

## Reference 2 — Sharjah Art Foundation

- **Brand & URL:** Sharjah Art Foundation — `https://www.sharjahart.org/en/`
- **Date inspected:** 2026-10-28 (direct `WebFetch`, first-hand)
- **Relevant page/interaction:** Homepage, language toggle, event/exhibition listing cards
- **Observed design qualities (first-hand):** A dual-language toggle ("English / العربية") at the top of every page, using URL parameters (`?lang=en` / `?lang=ar`) rather than separate subdomains or hard redirects — this preserves navigation state across the switch. Clean sans-serif typography prioritizing cross-script legibility over display flourish. Minimal, high-contrast palette (black text on light background) with color-coded category tags for scanability. Full-width photography in the hero carousel with minimal text overlay, letting imagery communicate across the language barrier. A modular card system for listings (image, title, date, category tag, description) that adapts cleanly to RTL without needing a different layout.
- **UX/visual principle worth learning from:** Treating Arabic as a parallel, designed experience rather than a mirrored translation layer — exactly this mission's explicit requirement ("Treat Arabic as a designed experience, not an automatically mirrored English layout"). The URL-parameter locale switch with preserved navigation state is directly comparable to RARE OUD's own `ro_locale` cookie + `?lang=` approach (`middleware.ts`), confirming the current technical pattern is sound, not just convenient.
- **Potential application to RARE OUD:** The card-based modular listing pattern (image / title / meta / tag / CTA) maps directly onto RARE OUD's catalog grid, trader deal list, and admin request list — all three already use a similar shape; this reference supports standardizing the card anatomy across all three rather than letting each surface drift independently (see WP3 component spec).
- **What should NOT be copied:** Sharjah Art Foundation is a non-commercial cultural institution — no cart, no price, no transactional urgency anywhere. RARE OUD must keep commercial affordances (price-on-request, "add to request list," wholesale quote states) that a gallery site has no reason to design for. Do not strip commercial clarity in the name of "editorial calm."

## Reference 3 — Oud Nazih Ghadban (artisan luthier)

- **Brand & URL:** Nazih Ghadban Oud workshop — `http://www.oudnazihghadban.com/`
- **Date inspected:** 2026-10-28 (direct `WebFetch`, first-hand)
- **Relevant page/interaction:** Homepage, About/maker-story section, product gallery
- **Observed design qualities (first-hand):** A carousel of workshop and instrument imagery establishes visual narrative *before* any product grid — material and craft are the first thing a visitor sees, not a promotional banner. Clear hierarchical navigation (Home → About → Products → Support → Gallery → Contact). Uppercase sans-serif headings for product categories ("OUD," "BUZUK," "ACCESSORIES") signal precision; body copy mixes credentialing language ("fifty years," construction technique) with more evocative description ("enchanting sound"). Neutral backgrounds let warm wood photography carry the color. An EN/AR language toggle is present, confirming bilingual presentation is already the norm in this specific product category, not an unusual accommodation.
- **UX/visual principle worth learning from:** Leading with maker credibility and material specificity (wood type, construction technique, years of practice) rather than lifestyle imagery — directly validates the plan's Principle 2 ("Material honesty. No stock photos, no fake inventory, no fake metrics") and pillar obligation "Real material in imagery (macro wood, rosette). No decorative gradients standing in for material."
- **Potential application to RARE OUD:** Product detail pages (`/product/[slug]`) should prioritize real construction/material facts (wood species, finish, string configuration) in the same visual weight as price — this is already partially specified in the locked plan's oud-spec gallery work (Session 1 commit `68425a7`, `lib/catalog/oud-specs.ts`) and this reference confirms that direction is correct, not a detour.
- **What should NOT be copied:** The site's carousel-driven homepage and somewhat dated visual execution (small imagery, dense uppercase blocks) read as a workshop brochure, not a premium digital retail experience. RARE OUD's locked plan already specifies a more contemporary grid and generous whitespace (Principle 6, "calm density") — do not adopt this reference's density or its dated interaction pattern, only its *content priority* (material truth first).

---

## Synthesis — what this research changes, and what it confirms unchanged

**Confirmed, no change needed:**
- The locked palette, motif system, and forbidden list (gold/metallic, clip-art, glassmorphism, bouncy easing) remain correct — all three references independently converge on restraint-as-luxury and material-first presentation, the same thesis the plan already encodes.
- The `?lang=`/cookie-based locale switch technical pattern is sound (matches Sharjah Art Foundation's approach at a respected bilingual cultural institution).

**Specific, applicable refinement for WP3/WP4:**
- Standardize a single card anatomy (image / title / meta line / status or category tag / CTA) across catalog, trader deals, wholesale list, and admin request list — currently each surface built its own variant. This is a **consolidation**, not a new pattern, and is a safe, low-risk design-system refinement to specify in WP3.
- Product detail pages should treat the oud-spec gallery (material/construction facts) as equal-weight to price and imagery, not a secondary tab — reinforces work already started in Session 1, no architectural change needed.

**Explicitly rejected from all three references (do not implement):**
- Aesop's collage-based navigation (wrong fit for a wayfinding-critical, multi-role catalog).
- Sharjah Art Foundation's absence of any commercial affordances (RARE OUD must keep them).
- Nazih Ghadban's dense, carousel-first homepage execution (the locked plan's airier grid is the correct call).

No screenshots are embedded in this document (both `WebFetch` passes return text-extracted markdown, not image capture); where a visual citation is needed for owner review, the live URLs above are directly inspectable.
