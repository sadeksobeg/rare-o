# Independent Verification Audit — Phase 8 (Storefront)

**Mode:** read-only verification. No fixes, commits, migrations, or pushes were made.

**Scope-change notice (mid-audit, from the coordinator, cost control):** live browser
testing (preview_start / click-through at desktop + 375px, the SF-12 re-click test, and
Lighthouse) was stopped partway through and the rest of this audit was completed via
automated quality-gate scripts plus static code review only. One live browser check *did*
run before the scope change landed (see §3, SF-01) and its result is reported as a live
finding; everything after that point is code review, explicitly marked as such. **Lighthouse
and all other live performance numbers were not measured** — this is a gap in this audit's
coverage, not a claim that the budget is met.

**Scope read:** `docs/ui-planning/MASTER-BUILD-PLAN.md` Part B (Definition of Done) and
Part C6 (SF-01…SF-12), `docs/ui-planning/plan/DECISIONS-ADDENDUM.md` → "Phase 8 (Storefront)
— 2026-10-31", `docs/ui-planning/evidence/phase-08-storefront.md` (implementer's report),
and the actual code on `phase/09-hardening` at commit `138a430` (`3aad9c3` is the Phase 3-9
feature commit; `138a430` is one documentation-only commit on top of it).

**Environment note:** this audit initially ran in a worktree that was still 74 commits
behind `phase/09-hardening` (missing all of Phases 3–9) — none of the files under audit
existed there. This was caught before any findings were written, the coordinator repointed
the working directory at the actual `phase/09-hardening` checkout, and the audit restarted
from there. Also encountered and resolved along the way, neither a Phase‑8 defect: (1) the
Prisma client was not generated in this checkout (`npx prisma generate` fixed it); (2) `npm
install` was required to repair a missing `node_modules/.bin` — this modified
`package-lock.json` as a side effect, which was reverted (`git checkout -- package-lock.json`)
immediately after, since it is out of scope for this audit and risked masking the G3
`npm overrides` security work from recent commits. `git status` is clean of this before
and after.

---

## 1. Quality gate (run independently, this session)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **PASS**, 0 errors |
| `npm run lint` (`next lint`) | **PASS**, 0 errors; 2 pre-existing warnings, both unrelated to Phase 8 (`components/storefront/cart-provider.tsx:97` and `components/ui/text-field.tsx:223`, both `react-hooks/exhaustive-deps`) |
| `npm run build` | **PASS** after 3 retries — see note below |
| `npm run check:i18n` | **PASS** — 1260 string keys match AR/EN; 53 inline locale ternaries at the documented ratchet baseline (unchanged) |
| `npm run test:week3` | **PASS** — 58/58 |

**Build note (not a Phase‑8 defect):** the build failed twice before passing, both
environment artifacts, not regressions:
1. First attempt: the known transient `next/font` Google Fonts fetch flake (`socket hang
   up` / `TypeError: Cannot read properties of null (reading '1')` in
   `@next/font/dist/google/loader.js`) — a pure network flake, matching the brief's known
   issue.
2. Second attempt: failed with `Cannot find module '.prisma/client/default'` and then,
   after generating the Prisma client, `'next' is not recognized` / `node_modules/.bin`
   missing entirely — this checkout's `node_modules` was incomplete on arrival (unrelated
   to Phase 8 code). Running `npx prisma generate` and `npm install` repaired it (see
   environment note above for the `package-lock.json` revert).
3. Third attempt (after repair): **compiled successfully**, all 72 app routes built,
   `npx next lint`-equivalent build-time check clean (same 2 pre-existing warnings).

`npm run test:wholesale-security` and `npm run test:d1-axe` were not run — the brief listed
them as "where applicable"; neither targets Phase 8 (storefront) surfaces specifically, and
given the mid-audit cost-control scope change, they were judged out of scope for this pass.

---

## 2. Static verification of the implementer's claims (`phase-08-storefront.md`)

All of the following were verified by reading the actual source on `phase/09-hardening`,
not by trusting the evidence doc.

| Claim | Status | Evidence |
|---|---|---|
| SF-03 vertical desktop thumbnails + hover zoom | **VERIFIED** | `components/storefront/product-gallery.tsx:174-185` renders a `lg:flex` vertical thumbnail column (hidden below `lg`); `components/storefront/product-zoom-stage.tsx` implements the hover-lens zoom (`onMouseMove` computes `%` position, a second layer with `backgroundImage`/`backgroundSize: 220%` swaps in on hover, `lg:block`-only, disabled under `prefers-reduced-motion`) |
| SF-03 buy box with trust rows, no payment wording | **VERIFIED** | `components/storefront/product-buy-box.tsx` renders `trust` rows passed from `app/(storefront)/product/[slug]/page.tsx:265-270`: `trustNoPayment`, `trustHandoff`, `trustUnique`, `trustWhatsApp`. Dictionary strings (`lib/i18n/dictionaries.ts:1491-1494` AR, `:2890-2893` EN) explicitly state **"لا دفع إلكتروني — الطلب يُكمَل عبر واتساب" / "No online payment — the request finishes on WhatsApp."** A grep of `lib/i18n/dictionaries.ts` for `ادفع`, `الدفع`, `pay now`, `checkout`, `credit card`, `card number`, `بطاقة ائتمان` returned **zero matches** outside the "no payment" trust string itself. No card icon imports found in `product-buy-box.tsx` (only `lucide-react` `ShieldCheck`/`Truck`/`Package`/`MessageCircle`). |
| SF-03 feature bullets from real specs/description, not placeholder | **VERIFIED** | `app/(storefront)/product/[slug]/page.tsx:144-147` builds `featureItems` by parsing `product.specsTextAr/En` and `description` via `parseFeatureLines` — derived from real DB fields, not hardcoded lorem ipsum |
| SF-03 A+ editorial modules with real data | **VERIFIED** | `aPlusBlocks` (page.tsx:149-162) uses real dictionary copy (`dict.product.craftStory`/`craftStoryBody`, `soundStory`/`soundStoryBody`) and the temporary instrument photography — not placeholder text |
| SF-03 breadcrumb includes category, links correctly | **VERIFIED** | page.tsx:199-230 renders Home → Catalog → Category (conditional on `product.category`) → Product, each `<Link>` pointing at `href("/catalog?category=<slug>", locale)` etc.; matching JSON-LD `breadcrumbJsonLd` emitted at :172-197 |
| SF-03 sticky mobile CTA bar | **VERIFIED** | `<StickyCtaBar watchId="pdp-cta">` at page.tsx:376-407, rendered only when `available`, wrapping price + `AddToCartButton` |
| SF-12 search regression (prior Critical: button only worked on homepage) **re-verified** | **VERIFIED FIXED, via code review (not live-clicked — see scope-change notice)** | `components/storefront/header.tsx:88-90`: `openSearch` unconditionally does `window.dispatchEvent(new Event("ro:open-search"))` — no homepage/pathname gate anywhere in the function. The listener side (`components/storefront/discovery/global-search-mount.tsx`) is mounted once in `app/(storefront)/layout.tsx:20`, the shared layout for **every** storefront route including `/catalog`, not conditionally rendered on the homepage route component. This matches `docs/ui-planning/plan/DECISIONS-ADDENDUM.md:116-124`'s own description of the fix ("Storefront search: now works from every page, not only the homepage... nothing was listening on any page except the homepage... wraps a `DiscoveryProvider` + search-only listener around the whole storefront layout"). **I could not click the real button and watch the overlay open this session** per the coordinator's cost-control scope change — this is a code-level confirmation only, not the live interaction test the brief originally called for. |
| SF-11 404 is fully branded, not generic Next.js error | **VERIFIED** | `app/not-found.tsx` renders the brand illustration, dictionary-driven heading/body, a working catalog search form, and Home/Catalog CTAs; `<meta name="robots" content="noindex, nofollow">` present |
| SF-04–06 reference number + WhatsApp deep link on success | **VERIFIED (code only)** | `components/storefront/request-form.tsx:98-148` renders `<HandoffSuccess>` with `reference={data.reference}`, `messageText={data.handoffMessageText}`, and a WhatsApp-open handler that calls `markRetailHandoffOpenedAction` then `window.open(link, ...)` — not clicked live this session |
| SF-04–06 reload doesn't duplicate the request | **PARTIALLY VERIFIED, with a UX gap — see Finding M-1** | Server-side: `lib/retail-request/service.ts:34-44,209-219` does real idempotency-key dedup (unique-constraint lookup both before insert and on a race via unique-violation catch), so a genuine resubmission with the same key cannot create a second DB row. Client-side: the success view exists only in transient React state (`useState<ActionResult>` in `request-form.tsx:71`), with no `sessionStorage`/URL persistence. A hard reload resets that state to `null`; since the cart was already cleared on success (`clear()` at line 184), the user lands on the **empty-cart view**, not a resubmittable form and not the success/reference screen either. No duplicate is created, but the reference number and WhatsApp link are **lost** on reload with no way to recover them from the UI. |
| SF-07/08 offer cards link to detail pages | **VERIFIED** | `app/(storefront)/offers/page.tsx:61,84` — `href(\`/offers/${slug}\`, locale)` |
| Temporary photography under `public/brand/instruments/`, `ATTRIBUTION.txt` present and accurate | **VERIFIED, format and content; IDs not independently resolved — see Finding L-1** | File exists, states "Unsplash License — free for commercial use" and "**Replace with client-owned product photography before production marketing claims**" in the first two lines, lists 10 `photo-<id>` Unsplash identifiers in the standard `images.unsplash.com` ID format. 9 actual image files + the attribution file are present in `public/brand/instruments/`. |

---

## 3. Live finding (before the scope change stopped browser testing)

**SF-01 (`/`) — hero LCP `<link rel="preload">` resolves to a broken URL and 400s.**

Before the coordinator's scope-change message arrived, a real dev server was started
(`npm run dev`, port 3000) and `/` was loaded once in the browser pane. The network log
showed:

```
GET /_next/image?url=function()%20%7B%20throw%20new%20Error(%22Attempted%20to%20call%20
HERO_OUD_LCP_SRC()%20from%20the%20server%20but%20HERO_OUD_LCP_SRC%20is%20on%20the%20client...
%22)%3B%20%7D&w=640&q=70 → 400 Bad Request
```

Root cause, confirmed by static code review:
- `components/brand/hero-oud-field.tsx` has `"use client"` at the top and exports
  `HERO_OUD_LCP_SRC = "/brand/hero-oud-atelier-f-e1.webp"` as a plain string constant.
- `components/brand/hero-lcp-preload.tsx` (no `"use client"` — a **server** component)
  imports that constant directly and interpolates it into a preload `href` via
  `encodeURIComponent(HERO_OUD_LCP_SRC)`.
- `app/(storefront)/page.tsx` (also a server component, no `"use client"`) renders
  `<HeroLcpPreload />` directly in the page body (line 72).
- Next.js's React Server Components boundary does not allow a server module to import a
  plain data export from a `"use client"` module — only components/functions may cross
  that boundary as opaque references. The bundler replaces `HERO_OUD_LCP_SRC` with a stub
  function that throws if invoked, and `.toString()`-ing that stub (via string
  interpolation/`encodeURIComponent`) is exactly what produces the literal
  `function() { throw new Error(...) }` text that ends up as the `url=` query param —
  hence the 400.
- The component's own doc comment (`hero-lcp-preload.tsx:3-16`) explains this preload was
  purpose-built to close a **measured 2.8s FCP-to-LCP gap** (LCP 4.9s vs FCP 2.1s, LCP
  sub-score 0.29) on the home hero — i.e. this is not a minor hint, it is the specific fix
  for the exact performance-budget risk the audit brief calls out (LCP ≤ 2.5s mobile,
  "the 3D hero scene must never block LCP"). As shipped, that fix does not work: the
  `<link rel="preload">` the browser receives points at a malformed URL and 400s, so it
  cannot be satisfying any request from the real `<Image>` component. The hero image
  still rendered in the one screenshot taken (the `<Image>` component's own `_next/image`
  request appears to succeed separately), so this is not a broken hero on its face — but
  the specific optimization the implementer built and documented to hit the LCP budget is
  dead code at runtime, and the exact regression (the 2.8s gap) it was written to prevent
  was not re-measured this session (Lighthouse was skipped per the scope change). This is
  reported as **High**, not Critical, because the page does not appear to be broken to a
  user — but it directly undercuts the one LCP-specific claim in the evidence doc, and
  should not be treated as "done" until re-measured.

This is the only live-browser-testing data point gathered this session. SF-02 through
SF-12 interaction claims beyond what's captured in §2 were **not** independently clicked
or screenshotted this session, per the scope change — they rest on code review only.

---

## 4. Findings by severity

**Critical:** none found.

**High:**

- **H-1 — Hero LCP preload (`HeroLcpPreload`) resolves to a broken URL, 400s, and does not
  perform the optimization it was written for.** See §3. Fix direction (not executed, out
  of scope for a read-only audit): either mark `hero-lcp-preload.tsx` `"use client"` so it
  can safely use the client constant, or move the raw path string into a server-safe
  constant (e.g. a plain `.ts` module with no `"use client"` directive) that both
  `hero-oud-field.tsx` and `hero-lcp-preload.tsx` import, and re-run Lighthouse against the
  LCP budget once fixed.

**Medium:**

- **M-1 — Retail request success screen (reference number + WhatsApp deep link) is not
  recoverable after a reload.** See §2 (SF-04–06 row). No duplicate request is created
  (server-side idempotency key dedup is solid), but the user-facing success state —
  including the reference number they may need to quote — lives only in transient React
  state and disappears on reload, replaced by an empty-cart view with no path back to it.
  Not tested live this session (scope change); flagged from code review as worth a product
  decision (e.g. persist to `sessionStorage` or route to `/request/[id]` so the success
  state survives a reload).

**Low:**

- **L-1 — Unsplash photo IDs in `ATTRIBUTION.txt` were not independently resolved against
  Unsplash.** The file's format, license statement, and "replace before production"
  language are all present and correct; the 10 listed `photo-<id>` strings follow
  Unsplash's real ID format and plausibly correspond to real photos, but this audit did
  not fetch each ID against Unsplash to confirm it resolves to an existing, correctly
  licensed photo (no web access was exercised for this check). Low impact given the
  explicit "temporary, replace before production" framing already in the file, but it
  should be spot-checked with actual internet access before this ships to a real audience.
- **L-2 — This audit's own live-testing coverage is incomplete.** Per the coordinator's
  mid-audit scope change, SF-02 (catalog filters/load-more/quick-view), SF-04–06 end-to-end
  (actual cart → request → success click-through), SF-09/10 bilingual rendering, SF-11
  offline state, and SF-12's actual click-and-watch-the-overlay-open behavior were **not**
  exercised live this session — only verified by reading source. This is a known gap in
  this audit's coverage, not a defect in the product; it should be closed with a live pass
  before this is treated as a fully closed audit gate, especially given the brief's own
  warning about the Phase-2 "search button" mistake (verifying the mechanism, not the real
  click) — this audit partially repeats that exact risk for SF-12, for cost reasons, and
  says so explicitly here rather than silently presenting the code-review result as
  equivalent to a live click.

---

## 5. Lighthouse / performance

**Not run.** The coordinator's mid-audit scope change explicitly excluded Lighthouse and
all live performance measurement from this pass to control cost. No LCP/CLS numbers for
`/`, `/catalog`, or a product page are reported here — this is a stated gap, not a "passed"
or "failed" result. Given Finding H-1 (a broken hero LCP preload), re-running Lighthouse on
`/` specifically should be a priority before this phase is considered performance-verified.

---

## 6. Temporary probes created and removed

- A `rare-oud-dev` preview server (port 3000) was started once for the single live
  navigation described in §3, then stopped (`preview_stop`) once the scope change arrived.
  No database rows, fixtures, or scripts were created.
- `npx prisma generate` was run (regenerates `node_modules/@prisma/client` — not a tracked
  file, no git effect).
- `npm install` was run to repair a missing `node_modules/.bin`; it modified
  `package-lock.json` as a side effect, which was immediately reverted with
  `git checkout -- package-lock.json`. Confirmed via `git status --porcelain` (clean,
  aside from this new report file) before finishing.

---

## 7. Overall verdict

**No Critical findings.** One **High** finding (H-1: the hero LCP preload is broken and
silently defeats the one documented performance fix for SF-01) should be fixed and
re-measured with Lighthouse before this phase is signed off as meeting the LCP ≤ 2.5s
budget. The no-payment-wording compliance check (SF-03) and the SF-12 search-availability
fix both check out from the code, but the SF-12 result specifically is a code-review
confirmation, not the live click-and-observe test the audit brief called for and that this
project's own history (the Phase-2 search finding) says is necessary — that gap is called
out explicitly (L-2) rather than glossed over. One Medium UX gap (M-1, lost success state
on reload) and one Low documentation-verification gap (L-1, Unsplash IDs not fetched) round
out the findings. Recommend: fix H-1, re-run Lighthouse on `/`, and do a live SF-02/04-06/09-10/11/12
click-through pass before treating Phase 8 as fully closed.
