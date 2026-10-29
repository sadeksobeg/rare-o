# Self-review log (VISION.md section 9)

Brief, factual notes per screen: what changed between the two critique passes and why.

## login.html (Wave 1)

**Pass 1 (build → first screenshot):** Split layout works — dark living brand scene (breathing resonance rings, grain, waveform, cursor-reactive glow) against a light form panel reads as intentional, not generic. Role switch (Admin/Trader) with sliding pill was broken on first render: the indicator used `inset-inline-start:0` combined with a `translateX` offset computed from LTR-assumption math, which in this RTL document pushed the indicator entirely outside its container. Fixed by switching to a physical `left` value computed directly from measured `getBoundingClientRect()` positions (direction-agnostic since the measurement itself already accounts for RTL layout) instead of mixing a logical CSS property with a transform.

**Pass 2 (after fix, full interaction test):** Verified live: role switch slides correctly in both directions and updates title/subtitle copy; password show/hide toggles and swaps the eye/eye-off icon; Caps Lock warning appears/disappears on keyup; forgot-password view swap works with a working back link; submit flow demonstrates loading (waveform dots) → error shake → loading → success (view transition where supported) → redirect to the matching role's home. axe: zero violations at 375 and 1440 after adding the missing `<main>` landmark (first run flagged `landmark-one-main` + `region`). No horizontal overflow at 375.

**Known limitation:** the rate-limit state (3+ failed attempts) is styled and wired but not reachable through the normal 2-attempt demo flow (1st fails, 2nd succeeds, by design so the reviewer doesn't have to fail three times to see success) — inspectable by setting `attempts` past the threshold in dev tools. Documented rather than silently left for someone else to find.

## admin-dashboard.html (Wave 1)

**Pass 1:** Layout delivers section 5.2's full list — count-up KPIs with trend deltas, a Chart.js area chart (requests/14 days) and donut (domain split, including the new brokerage slice) themed from `tokens-v3.css` custom properties rather than hardcoded hex, an action queue with inline quick-action icon buttons and age badges (one visibly overdue in amber/red), a dark WhatsApp card with a live pulse dot and a QR re-link affordance, a brokerage widget, a recent-activity feed with avatar initials, a Ctrl/Cmd-K command palette, and a quick-create FAB. Two real bugs on first render: (1) the FAB menu was visibly open by default — `[hidden]` lost to `.ro-fab-menu { display: grid }` because both rules have equal specificity and the class rule loads after the UA stylesheet; fixed with an explicit `.ro-fab-menu[hidden] { display: none }`. (2) the KPI row briefly looked blank in one screenshot — turned out to be the GSAP stagger entrance caught mid-transition, not a real bug; a second screenshot after the animation settled showed all four cards correctly, confirmed by also checking their computed opacity/text directly (not just a screenshot).

**Pass 2:** Verified live: command palette opens on Ctrl/Cmd+K, arrow keys move selection, Enter navigates, Escape closes (native `<dialog>`); FAB opens/closes on click and closes on outside click; admin sidebar collapses to the same hamburger + `<dialog>` drawer pattern as the trader header below 1023px. axe: zero violations at 375 and 1440 (x3 runs each, after `document.fonts.ready`). Horizontal overflow: 3px at 375, traced to `<html>` itself (sub-pixel rounding from the emulated device's fractional viewport width, not a layout defect — no descendant element exceeds the viewport, nothing is visibly clipped).

**Known limitation:** four sidebar links (Deals, Wholesale, Traders, Customers) still point at `#` — Wave 2-4 screens per VISION.md section 10. Left as `#` rather than a fake destination.

## trader-home.html (Wave 1)

**Pass 1:** Three task cards (deal/wholesale/**brokerage**, the new one per VISION.md 5.8), personal stats with a half-circle acceptance-rate gauge and a bar chart of monthly deals, a horizontally-scrollable offers carousel, bottom tab bar with an animated active indicator, and the dark-gradient trader header. Real overflow bug on first render at 375px: 320px of horizontal scroll, traced to `.th-stats-row { grid-template-columns: repeat(2, 1fr) }` — the exact same bare-`1fr` CSS Grid min-content trap fixed in the previous round's admin dashboard, this time triggered by each stat card's `<canvas>` (Chart.js hadn't resized it yet at first paint, so it still held its intrinsic width). Fixed with `minmax(0,1fr)`, and added `min-width:0` to `.ro-chart-box` generally so the same canvas-intrinsic-width issue can't recur in any chart container. A second, unrelated bug surfaced at the same breakpoint: the trader header's nav never collapsed to the hamburger at all — `.tr-header`/`.tr-hamburger`/`.tr-main` turned out to not exist anywhere in the current `shared.css`. They lived only in each old screen's own inline `<style>` block pre-rebuild, and the responsive-drawer version built in the previous round lived in a `shared.css` that was later fully replaced by the real-PLAN.md-tokens rewrite without carrying the trader-header rules forward. Added them to `shared.css` properly this time (shared across every trader screen, not copy-pasted per file).

**Pass 2:** Verified live: hamburger drawer opens/closes (confirmed `dialog.open` false after Escape, not just visually), offers carousel actually scrolls (`scrollWidth` 752 vs `clientWidth` 351), bottom tab indicator positions under the active tab and repositions on resize. axe: zero violations at 375 and 1440 (x3 runs) after adding `tabindex="0" role="region"` to the offers carousel (same `scrollable-region-focusable` rule as the admin table from the last round). Zero horizontal overflow at 375 after the grid fix. Full-width desktop layout (inline nav, no hamburger, no bottom tab bar) confirmed at 1200px.

**Known limitation:** this screen content (names, counts) is demo data, not yet cross-referenced with the other trader screens (deal-wizard, wholesale) since those aren't rebuilt this wave — VISION.md section 6's "same records across all screens" rule applies once Wave 2 rebuilds those.

## storefront-home.html (Wave 1, new screen per VISION.md 5.9)

**Pass 1:** Full-bleed dark hero (breathing rings, large Amiri display type, GSAP word-by-word-style choreography, cursor-independent since this page has no pointer-glow), a craft-story section with a pull-quote and three icon-led value props, a collections grid using the "Material Plate" concept from PLAN.md 10.3 (grain texture + a faint brand-glyph watermark per category instead of a stock photo), and a dark trader-recruitment band. Nav turns solid on scroll past 80px. Two real bugs: (1) the nav's text links (`الحرفة`/`المجموعات`/`دخول الإدارة`) didn't collapse at 640px despite a `@media` rule targeting `.sf-nav-links { display: none }` — an inline `style="display:flex"` on the same element always wins over an external stylesheet rule, media query or not; moved that styling into the CSS class instead of inline. (2) count-up/stagger elements appeared briefly blank in early screenshots on this page too, now a recognized pattern (GSAP mid-transition at screenshot time) rather than something to chase as a new bug each time — confirmed via computed-style checks, not just re-screenshotting.

**Pass 2:** Verified live: nav solidifies on scroll, hero choreography plays once on load, craft-story quote and collection cards reveal on scroll via ScrollTrigger (kept on a separate `data-scroll-stagger` attribute from `motion-v3.js`'s own immediate `data-stagger`, specifically to avoid the two systems fighting over the same elements' opacity). axe: zero violations at 375 and 1440 (x3 runs each) after adding the missing `<main>` landmark and an `<h2>` for the craft-story section (visually hidden — the section's content speaks for itself without a visible duplicate title, but the heading level needs to exist for the outline). Zero horizontal overflow at both breakpoints.

**Known limitation:** collection cards link to `#` — the catalog screen itself is Wave 3 (VISION.md section 10). Product imagery is the Material Plate placeholder throughout, consistent with PLAN.md 10.3, since no product photography exists yet.

---

## Checkpoint 2 (owner rejection: "still primitive", new direction)

The owner rejected checkpoint 1 as a wireframe aesthetic with motion added - line strokes, hairlines, flat panels, no real logo. Before rebuilding, searched `public/brand/` and found the project's actual logo and studio photography already in the repo (recorded in `ASSETS.md`), rather than assuming none existed and reaching for stock downloads.

### login.html (round 2)

**Pass 1:** Real logo (vectorized from `public/brand/mark-master.png`) extruded into a lit, rotating 3D object via Three.js + SVGLoader - genuinely required solving two non-obvious problems first: three.js r160 removed the non-module `examples/js` build the first attempt used, so this needed ES modules + an importmap (verified working with a throwaway test page before touching the real file); and the 3D object, while rotating, grew large enough on some frames to visually cover the headline text sitting below it in the same flex-positioned scene - not catchable from a single static screenshot, only from watching it rotate and from direct rect measurement.

**Pass 2:** Fixed both structurally (canvas constrained to the upper 62% of the scene; headline moved into its own scrim-backed zone that can't be covered regardless of 3D object size) rather than by luck of camera angle. Found a second, unrelated bug while re-verifying: `backdrop-filter` on the glass form panel corrupted the paint of the headline text elsewhere on the page - a real Chromium compositor interaction between backdrop-filter and a live WebGL canvas, reproduced consistently, `isolation`/`will-change` confirmed as not a fix. Removed backdrop-filter; panel depth now comes from opacity + layered shadow. Re-verified axe zero violations and zero overflow after both fixes, from a fresh browser tab (see below).

### admin-dashboard.html (round 2)

**Pass 1:** Real logo in the sidebar (CSS `invert()` to read as cream against the dark background - confirmed this renders correctly rather than assuming a filter trick works), a new animated gradient-mesh header band with a large faint logo watermark, charts given a soft purple drop-shadow glow, KPI cards given real depth (inner hairline + hover lift) instead of flat cards.

**Pass 2:** Verified live at 375 and 1440: axe zero violations, zero real overflow (3px `<html>`-level sub-pixel rounding only, the same previously-confirmed-benign pattern from Wave 1). No new bugs found on this screen this round.

### trader-home.html (round 2)

**Pass 1:** The three task cards (including brokerage) became image-led with real product photography and a hover zoom instead of flat color panels with a small icon, per VISION.md 5.8's explicit ask; the offers carousel also swapped its icon placeholders for real photography. Real logo in the header.

**Pass 2:** Verified live: axe zero violations, zero overflow at 375/1440.

### storefront-home.html (round 2)

**Pass 1:** The 3D logo object now ties into scroll: `logo-scene.js` gained `setScrollOffset`/`setCameraZ` controls, driven by a `ScrollTrigger` with `scrub` across the hero section, so the object keeps rotating and the camera dollies in as the user scrolls past it - VISION.md 5.9's "camera moves through its details as the user scrolls." SplitText word-reveal headline, real macro photography for the craft-story section, real product photography on all three collection cards (not icon watermarks).

**Pass 2:** Hit the strangest issue of this round: after building, the subtitle and both CTA buttons in the hero looked completely absent in screenshots, while every DOM check (computed opacity 1, correct color, correct position, `elementFromPoint` hitting the actual button) said they were there and correctly painted. Ruled out the WebGL/backdrop-filter theory from login.html by hiding the canvas entirely - still absent. Loaded the identical URL in a brand-new browser tab: rendered perfectly, immediately. This matches a stale-tab rendering artifact already documented earlier in this engagement for a different symptom (the dashboard count-up that looked "stuck" in a long-reused tab) - the browser tab used continuously since Wave 1 had accumulated some compositor corruption specific to this automated test harness, unrelated to the page's own code. Closed that tab and re-verified every remaining check from a fresh one. Separately found and fixed a real, if minor, accessibility bug common to both this page and login.html: SplitText's generated span gets an `aria-label` with no ARIA role, which axe correctly flags (`aria-prohibited-attr`); fixed by setting `role="text"` on the target element before splitting.

**Known limitation:** the stale-tab artifact above cannot be fully ruled out as *never* affecting a judgment earlier in this session without re-testing every prior screenshot in a fresh tab, which wasn't done retroactively - stated here rather than silently assuming all earlier checks were unaffected. Every axe run, overflow check, and screenshot in this checkpoint-2 round, however, was taken from a fresh tab after this was discovered.

---

## Checkpoint 3 (owner verdict: "IMPROVED, NOT ACCEPTED" — build-method pivot)

The owner identified the build *method* — hand-drawing every control in
static HTML — as the actual root cause, not any single screen's execution.
Mandated direction: stop building static HTML mockups; build instead in an
isolated Next.js workspace (`design-lab/`) on top of ready-made, polished
component libraries (shadcn/ui, Magic UI, Aceternity UI) rather than
hand-rolling controls. Also mandated: a security correction on the
traders-management screen (admin resets → system-generated temp password
shown once → trader forced to change it — admin never sees the real
password), and five new account/user-management screens.

### design-lab/ scaffold and the four signature screens

**Pass 1:** Scaffolded the workspace (shadcn `init -b radix --rtl`, Magic UI
and Aceternity registries, Motion/GSAP/R3F/Recharts), ported real PLAN.md
tokens into `app/globals.css`, real D4 Google Fonts via `next/font/google`.
Two real, non-cosmetic bugs found before any screen was usable: (1) the dev
server's build trace showed it trying to import `@/lib/security/csp` from a
`middleware.ts` that does not exist in `design-lab/` — Next.js's workspace-
root inference was reading the parent repo's production `middleware.ts`
(JWT verification, CSP, session cookies) because `design-lab/` sits nested
inside a tree that itself looks like a monorepo root. Fixed by pinning
`turbopack.root`/`outputFileTracingRoot` in `design-lab/next.config.ts`;
confirmed fixed by the browser tab title changing to "RARE OUD — Design
Lab" and zero server errors referencing the parent's files afterward. (2)
The 3D logo (now required explicitly after checkpoint 1) clipped at some
rotation angles — traced to a fixed camera distance that only cleared the
model's flattest silhouette. Fixed with a proper fit: camera distance
derived from the model's bounding **sphere** radius with 22% padding
(`components/brand/logo-scene.tsx`), which by construction cannot clip at
any rotation, not just the ones checked by eye.

**Pass 2:** Verified live on `/admin/traders`: a third real bug, found
while trying to click the row "more actions" button — clicks kept landing
on the sidebar's own "المنتجات" link instead, causing an accidental
navigation to an unbuilt route. `getBoundingClientRect()` on the actual
button showed it rendering at x≈98–130px, inside the sidebar's own 0–256px
footprint, while `document.documentElement.scrollWidth === clientWidth`
(no page-level scrollbar — the overflow was hidden under a sibling, not
visibly scrollable). Root cause was not a `min-width:0` containment issue
(the first fix attempted, which did nothing): shadcn's `Sidebar` defaults
to `side="left"` (a **physical** CSS value — `left-0`), while the page's
`dir="rtl"` flex layout reverses DOM order so the sidebar's own in-flow
spacer reserved space on the **physical right**. The fixed, visible sidebar
panel and its own layout-reserving spacer disagreed about which side of the
screen they were on, so content rendered as if the full viewport width were
available and the sidebar floated on top of it. Fixed with `side="right"`
on `<Sidebar>` in `components/admin/admin-sidebar.tsx`, which aligns the
fixed panel with where RTL flex actually reserved its space. Re-verified:
dropdown opens in the correct position, full reset-password flow (confirm
dialog → show-once temp-password dialog → copy button) works end to end.
Also chased what looked like a KPI-ticker bug (dashboard showed "٠" for all
four KPIs in one screenshot) — confirmed via direct DOM text-content read
that the real settled values (17/7/5/4) were correct; the screenshot had
just caught the Motion spring mid-animation, the same category of
screenshot-timing false-positive documented repeatedly in earlier rounds,
not a new defect. Also confirmed, from the live server's own `preview_logs`
output (not the browser's cumulative, cross-navigation console buffer),
that a "new Date() in a Client Component" error attached to
`admin-topbar.tsx` was a **stale log entry** — the file on disk already
carries the earlier fix (seed state at a fixed hour 8, real time computed
only inside `useEffect`) — the same stale-log-buffer pattern documented in
earlier rounds, now confirmed to also apply to the dev server's own log
tail, not only the browser console.

### Account/user-management screens (owner's section E)

Built `/admin/profile` (personal data; change-password with a live
strength meter; 2FA toggle revealing setup instructions; active sessions
list with a sign-out-others confirmation), `/admin/team` (members list,
role badges, an Owner/Manager/Staff permissions matrix, invite dialog,
disable/enable confirmation — Owner row has no disable action, by design),
`/admin/customers` (list + a detail sheet matching a customer's retail
requests from the shared fixtures), `/admin/audit-log` (filterable
who-did-what-when reading the existing `auditLog` fixture), and
`/force-password-change` (the trader-side half of the security correction:
a one-time gate screen, deliberately kept outside the `/trader` layout so
it carries no nav — the same pattern as the login screen — with a live
strength meter and confirm-match validation gating the submit button). All
five verified live via screenshot + DOM read, not just visual inspection:
the team page's permission matrix renders fully, the customer sheet shows
the matched request records (not placeholder text), the audit log's search
filters correctly, the profile page's 2FA switch correctly reveals/hides
its setup panel and its password field's strength label updates live
("مقبولة" at `abc123`), and the forced-password-change page's submit
button stayed correctly disabled until both fields matched.

### trader-home and storefront-home

**Pass 1:** Rebuilt both using the same content structure as the old
static mockups (task cards, stats, offers carousel for trader-home;
3D-logo hero, craft story, collections grid, trader CTA band for
storefront-home) but on real components and the shared `lib/fixtures.ts`
so trader stats match the `traders` fixture's `t1` record exactly (9
deals, 78% acceptance) rather than being re-typed as separate numbers.

**Pass 2:** Verified live by scrolling through both pages at 1280×800:
the 3D hero renders with zero visible clipping at its resting rotation,
real photography loads in every card, and the stats settle to the correct
fixture values (confirmed via DOM text read, same ticker-timing caveat as
above). Found one real bug on `/`: the storefront nav kept its light
(sand-colored) text permanently, which the old static mockup had handled
with a scroll-triggered `.is-solid` class switch that was never ported.
Past the dark hero, the nav became genuinely illegible against the light
sand sections below — not a cosmetic nitpick, a contrast/legibility defect.
Fixed with a scroll listener that switches the nav to a solid light bar
with dark text (and un-inverts the logo) past ~75% of the viewport height;
re-verified by screenshot at both scroll positions.

### Deliberately not done this round, stated rather than silently skipped

- **Full copy rewrite pass with a before/after table.** Existing copy was
  largely carried over from the already-approved static-mockup content
  (login, dashboard, trader-home, storefront-home) rather than rewritten
  from scratch; the five new account/user-management screens are new
  copy, not yet separately audited against the ux-copy skill checklist
  word by word.
- **Icon-size and type-scale audits as a separate documented pass.** Built
  consistently (Lucide, stroke 1.5, `size-4`/`size-5` i.e. 16/20px, 40px
  feature-icon containers) but not independently re-audited screen by
  screen with a checklist.
- **World-class benchmark comparison boards** (Linear/Stripe/Vercel/Apple/
  Aesop reference captures in `docs/ui-planning/benchmarks/`).
- **The Playwright capture script** targeting `design-lab`'s dev server
  (video + live reduced-motion + axe at 375/1440, Arabic and English).
  Verification this round was done via the browser pane directly
  (screenshots, DOM reads, `preview_logs`), which caught and fixed four
  real bugs, but is not the recorded, repeatable video-based evidence the
  owner asked for.
- **English-language pass.** Every screen built this round is Arabic-only;
  no `lang="en"` verification was done.

These are the open items for the next round, not silently dropped
requirements.

---

## Checkpoint 3 follow-up: quality pass on the 10 existing screens

The owner's follow-up verdict ("NOT ACCEPTED YET") was explicit that the
items deferred above are exactly the owner's main complaints, and that
quality on the 10 existing screens comes before any new screen. This
section covers items 1–4 of that follow-up (copy, type scale, icons,
numerals); benchmarks, the Playwright capture, and brokerage are tracked
separately and were not completed in this pass (see note at the end).

### Numerals (D5: Western digits everywhere)

Root cause: `Intl.DateTimeFormat("ar-SY", ...)` in `admin-topbar.tsx` (the
greeting date) defaults to the Arabic-Indic numbering system unless the
`-u-nu-latn` Unicode extension is appended — the one place in the app that
actually produced Arabic-Indic digits. Added `lib/format.ts` with
locale-aware helpers that always append `-u-nu-latn`, routed the topbar
date through it, and pinned `chart.tsx`'s bare `toLocaleString()` to
`"en-US"` explicitly. Verified via DOM text extraction on `/admin`: every
digit (date, KPIs, deltas, chart total, table dates) is Latin.

### Type scale

Defined one scale in `app/globals.css` under `@theme inline`
(`--text-display/h1/h2/h3/body/small/caption`), using PLAN.md section 5's
exact `clamp()` sizes and Arabic line-heights — not invented values.
Grepped every ad-hoc Tailwind text-size utility (`text-xs/sm/base/lg/xl/
2xl/3xl/...`) in `app/` and the admin/trader component layer:

**103 occurrences across 13 files → 0** (re-grep confirms zero remaining;
`components/ui/*`, the imported shadcn/Magic UI/Aceternity library source,
is intentionally out of scope — it's generic primitives, not this app's
content hierarchy).

Caught a real regression while verifying live: mapping the admin
dashboard's topbar greeting to `text-display`-adjacent `text-h1` made it
wrap to two lines and crowd the topbar's search/bell/avatar row, since
that role lives in a shared, height-constrained row rather than its own
full-width page header (unlike `/admin/traders`, `/admin/team`, etc.,
which correctly use `text-h1` for their page title). Dialed it back to
`text-h3`, matching the brand-wordmark weight already used elsewhere in a
topbar. Re-verified single-line, no crowding, on `/admin`, `/trader`,
`/login`, and `/admin/traders`.

### Icon audit

Grepped every Lucide icon usage in the same scope. Found 7 non-compliant
sizes and several missing `strokeWidth`:

| File | Before | After |
|---|---|---|
| `login.tsx` (password show/hide) | `size-[18px]`, no stroke rule violation but arbitrary | `size-5`, `strokeWidth={1.5}` |
| `login.tsx` (Caps Lock warning) | `size-3.5` | `size-4`, `strokeWidth={1.5}` |
| `login.tsx` (footer shield) | `size-3.5` | `size-4`, `strokeWidth={1.5}` |
| `login.tsx` (rate-limit banner shield) | `size-4`, no strokeWidth | `size-4`, `strokeWidth={1.5}` |
| `admin/page.tsx` (status-badge icon) | `size-3`, no strokeWidth | `size-4`, `strokeWidth={1.5}` |
| `admin/page.tsx` (KPI trend arrows ×2) | `size-3.5`, no strokeWidth | `size-4`, `strokeWidth={1.5}` |
| `admin/traders/page.tsx` (copy-success check) | no strokeWidth | `strokeWidth={1.5}` |

Verified the remaining non-16/20/24 `size-N` usages the sweep found
(`size-1.5`/`size-2`/`size-2.5`/`size-9`) are decorative status dots, a
legend swatch, and an icon-button container — not Lucide icons — so out
of scope for this rule. Feature-icon containers (trader-home task cards,
the force-password-change screen's icon) were already compliant at a
fixed 40px (`size-10`). Re-verified live: the badge icon at 16px doesn't
look oversized inside its small badge; the login eye icons at 20px read
proportionate.

### Copy pass (design:ux-copy skill)

Read every user-facing string on all 10 screens against the skill's
checklist (clear, concise, consistent, useful, human; verb-first CTAs;
error messages state what+why+how; confirmation dialogs name the actual
action on the button, not "OK"/"Confirm"). Most existing copy already
held up — it carries over from the already-approved static-mockup content
for the four signature screens, and the five new account-management
screens were written with these principles from the start. The real,
material defect found was **three places where an internal dev note had
leaked into user-facing copy** — text that breaks the fourth wall and
reads as obviously unfinished, which is a more serious defect than
awkward phrasing:

| Screen | Element | Before | After |
|---|---|---|---|
| `login.tsx` | Submit error | "بيانات الدخول غير صحيحة — جرّب مرة أخرى (هذا نموذج توضيحي)" ("...this is a demo") | "البريد أو كلمة المرور غير صحيحة" (PLAN.md's own prescribed copy for this exact banner, §1415) |
| `login.tsx` | Footer note | "محاولات كثيرة تؤدي لإيقاف مؤقت 15 دقيقة — حماية فعلية موجودة في الكود" ("...real protection exists in the code") | "محاولات الدخول المتكررة تُوقَف مؤقتاً لحماية حسابك" |
| `login.tsx` | Forgot-password subtitle | "أدخل بريدك الإلكتروني وسنرسل رابط استرداد — هذا نموذج، لا إرسال حقيقي" ("...this is a demo, nothing is really sent") | "أدخل بريدك الإلكتروني وسنرسل رابط استرداد كلمة المرور" |
| `admin/customers/page.tsx` | Sheet empty state | "لا توجد طلبات مطابقة في بيانات العرض" ("...in the demo data") | "لا توجد طلبات لهذا العميل بعد" |

Three further real (non-dev-note) copy fixes, applying the skill's rules
directly:

| Screen | Element | Before | After | Why |
|---|---|---|---|---|
| `admin/traders/page.tsx` | Page subtitle | "إدارة حسابات التجّار — لا يمكن لأحد رؤية كلمة مرور تاجر مخزَّنة، فقط إعادة تعيينها" | "إدارة حسابات التجّار — كلمة مرور أي تاجر لا تُعرض لأحد، يمكن فقط إعادة تعيينها" | States the system's behavior as a confident fact rather than an awkward "no one can" construction; fixes an adjective-placement ambiguity |
| `admin/traders/page.tsx` | Reset-password confirm description | "...كلمة المرور الحالية للتاجر — إن وُجدت — لن تكون مرئية لك..." | "...كلمة مرور التاجر الحالية لن تكون مرئية لك..." | Dropped "إن وُجدت" ("if it exists") — unnecessary hedging; an active trader account always has a password |
| `admin/traders/page.tsx`, `admin/team/page.tsx` | Disable/enable confirm button | "تأكيد" (generic "Confirm") | "تعطيل الحساب" / "تفعيل الحساب" (dynamic, matches dialog title) | Skill rule: "Label buttons with the action... not OK/Cancel" — the confirmation dialog already names the action; the button should too |

All seven fixes verified live (screenshot + `get_page_text`/DOM read, not
just source review): the login error banner, the forgot-password
subtitle, the footer note, and the traders/team disable-dialog buttons
all render the corrected copy.

**Not done in this pass, stated rather than silently dropped:** a
word-by-word audit of every remaining string (CTA verb-form choices like
"إضافة منتج" vs. an imperative "أضف منتجاً" were deliberately left as-is
— the masdar/verbal-noun form is itself idiomatic, professional Arabic
product copy, not a defect, so mechanically converting every button to a
literal imperative per the skill's English-language example would make
the copy *less* natural, not more); the English-language version of every
screen with a working locale toggle (needs real i18n infrastructure, not
built yet); and benchmarking this copy against reference products'
microcopy specifically (the benchmark boards themselves are also not
built yet — see the open-items note in the prior checkpoint-3 section
above).

### English locale (item 1, remainder)

Built real i18n infrastructure (`lib/i18n.tsx` — `LocaleProvider`/
`useLocale`/`useDict`, `lib/dictionaries.ts` — one `{ar, en}` dictionary
per screen) rather than the static-mockup era's dual-render `data-lang`
hack, since this stack is meant to be ported into the real app. Converted
all 10 screens; added a `LocaleToggle` control to every topbar/nav and
both standalone gate screens (login, force-password-change).

Two real bugs surfaced and fixed while verifying live, not assumed away
from reading the code:

1. **Persistence race.** The first implementation read `localStorage`
   into `useState`'s lazy initializer, then had a separate `[locale]`-
   dependency effect that wrote the current locale back to storage. Both
   effects fire in the same commit on mount; the write-effect's closure
   still held the pre-correction default and silently overwrote a saved
   "en" preference back to "ar" before the read could take effect. The
   toggle worked in memory for the rest of that page view but never
   survived a reload — caught by explicitly testing a hard navigation
   after toggling, not just the in-session click.
2. **Hydration mismatch.** The same lazy-read-into-initial-state pattern
   caused a second, more visible bug: a real `Hydration failed` error,
   caught live via the browser's error overlay and confirmed (not
   assumed) by checking a **fresh tab's** console — the server always
   renders `<html lang="ar">`, but the client's first paint read "en"
   from storage and rendered English strings immediately, so React
   discarded and regenerated the mismatched subtree.

Both fixed the same way: initial state always matches the server's
"ar" default deterministically; the saved locale is applied only in an
effect that runs once, after hydration commits (gated behind a
`hydrated` flag so the persisting effect can't fire with a stale value
before that correction lands). Re-verified from a brand-new tab (not the
tab that had the bug) with zero console errors, and confirmed the
toggle's choice now survives both client-side navigation and a hard
reload.

Verification also caught two smaller real gaps, not just the
infrastructure bugs: the avatar initial stayed Arabic ("س") in English
mode on three screens, because it came from a static `avatarInitials`
field instead of being derived from the already-locale-resolved display
name — fixed by deriving it from the name everywhere (and removing the
now-redundant field); and team members' "last active" column had no
English text at all — fixed by adding `lastActiveEn` to the fixture
(trader `city`/`cityEn` already needed the same treatment and got it too).

**Verified per screen:** every one of the 10 screens read correctly in
both languages via `get_page_text`, not just a visual screenshot check —
catching exactly the kind of fixture-field gap (city, last-active) that
a screenshot alone would likely miss at a glance.
