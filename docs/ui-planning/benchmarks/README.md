# World-class benchmark boards (checkpoint-3 follow-up, item 5)

Per-screen comparison against real, live reference products, matched on
8px spacing rhythm, density, hierarchy, type scale, icon sizing, states,
and overall polish. Each folder holds the reference screenshots
(`ref-*.jpg`) and our own screen (`ours-*.jpg`), captured live in this
session — not recalled from memory or assumed.

**Honesty note on sourcing:** the owner named Linear, Stripe, Vercel,
Apple, and Aesop. Live capture succeeded for Vercel (login), Apple
(sign-in, product pages), Linear (product UI, after several retries —
its `/login` subdomain never rendered past a loading/network-error state
in this sandboxed browser) and Stripe (product UI embedded in their
marketing site — `dashboard.stripe.com/login` returned a blank page,
likely bot-protection). **Aesop could not be captured at all** —
`aesop.com` sits behind a Cloudflare bot challenge that never resolves in
automation. Where a named source failed, it is stated here rather than
silently substituted or faked; Apple's own product pages filled the gap
for storefront-home since Apple was also explicitly named.

---

## 1. Login (`login/`)

**References:** `ref-vercel-login.jpg`, `ref-apple-signin.jpg`
**Ours:** `ours-login.jpg`

Vercel and Apple both use a single centered card on a near-flat
background, large-target inputs, a full-width primary button, and almost
no competing visual weight — the form is the only thing on the page.

**Gap assessed:** Our login is a *different*, deliberate direction — a
split-screen with a dark, branded 3D-logo scene on one side and the form
on the other — which is what VISION.md's "full creative freedom" and the
4-signature-screens brief actually asked for, not a generic centered-card
clone. Held to the references' own standard of restraint rather than
their specific layout: input height, button weight, and spacing in our
form panel (`p-8`, `max-w-sm`, `size="lg"` inputs/button) already match
their generous-padding, single-focus discipline. **No structural gap
found here worth forcing a change for** — the difference from the
references is the brief's own intent, not a quality shortfall. This is
stated plainly rather than inventing a gap to "find" one.

---

## 2. Admin dashboard (`admin-dashboard/`)

**References:** `ref-linear-product-ui.jpg`, `ref-stripe-product-ui.jpg`
**Ours:** `ours-admin-dashboard.jpg`

Linear's dashboard reads as typography and spacing first, boxes second —
its sidebar and content areas use hairline dividers, not a ring/shadow on
every single grouped element. Stripe's data cards (the usage-meter panel)
are reserved for content that benefits from a visual container (a chart,
a metered value), not for every individual stat.

**Gap found and fixed:** our first pass wrapped all four KPI tiles *and*
both chart panels *and* the table in identical `Card` chrome (ring +
background + padding) — seven uniform boxes on one screen, the exact
"SaaS-card kit" pattern (one card treatment for everything regardless of
hierarchy) that reads as generic/AI-templated rather than considered.
Fixed by demoting the four KPI tiles to quiet stat blocks (a plum
start-border accent on hover/group, no ring or card background) under a
single hairline divider, while keeping full `Card` treatment only for the
charts and the table — the elements that actually contain grouped,
multi-part content. Re-verified live: KPI numbers now read as a dense
stat band closer to Linear's hierarchy, charts/table keep their
containers, no layout regression.

---

## 3. Trader home (`trader-home/`)

**References:** `ref-linear-product-ui.jpg`, `ref-stripe-product-ui.jpg` (reused — trader-home is structurally a personal/task-oriented operations home, the same category Linear's and Stripe's UI shots represent)
**Ours:** `ours-trader-home.jpg`

**Gap found and fixed:** the same uniform-card issue as the admin
dashboard, here on the two "My Stats" tiles (deals this month, acceptance
rate) — wrapped in full `Card` chrome for just two numbers sitting beside
three large, already-strong photographic task cards above them. Fixed the
same way: quiet stat blocks with a plum start-border and a hairline
divider under the row, removing the now-unused `Card`/`CardContent`
import. The three photographic task cards (the screen's real visual
anchor) are untouched — they were already matching the references'
"one bold element, quiet surroundings" discipline.

---

## 4. Storefront home (`storefront-home/`)

**References:** `ref-apple-airpods-hero.jpg`, `ref-apple-story-section.jpg`
**Ours:** `ours-storefront-hero.jpg`, `ours-storefront-craft-section.jpg`

Apple's product hero: one large centered subject, minimal copy, generous
vertical rhythm, no competing UI chrome. Their feature/story sections:
centered editorial headline, large empty margins, a single idea per
screen.

**Assessed, no fix forced:** our hero (3D rotating logo, large Amiri
display headline, two CTAs) already follows the same "one bold subject,
quiet frame" principle — at display-scale type (fixed in the earlier
type-scale pass) the headline now carries real visual weight the way
Apple's does. The craft-story section (real macro photography + pull
quote + three value props) matches Apple's photo-plus-copy editorial
pattern reasonably closely already. No uniform-card issue here since this
screen was never built with `Card` wrappers — it's vision/VISION.md's
"Material Plate" / editorial-split pattern from the start.

---

## 5. Traders management (`traders-management/`)

**References:** `ref-linear-sidebar-nav.jpg`, `ref-stripe-product-ui.jpg`
**Ours:** `ours-traders.jpg`

**Assessed, no fix forced:** this screen is a single data table inside
one `Card`, which is the appropriate container here (one coherent grouped
dataset, not several independent stats) — it already matches Linear's own
pattern of one dense table per view rather than the KPI-tile problem
found on the two dashboard screens above. Sidebar nav icon sizing (20px,
`strokeWidth={1.5}`) and spacing rhythm already match Linear's own dense,
quiet sidebar from the reference capture.

---

## Summary: gaps found vs. closed

| Screen | Gap found | Closed this round? |
|---|---|---|
| Login | None (direction difference, not a quality gap) | n/a |
| Admin dashboard | Uniform card chrome flattening KPI hierarchy | **Yes** — KPI tiles demoted to quiet stat blocks |
| Trader home | Same uniform-card issue on the stats row | **Yes** — same fix applied |
| Storefront home | None found | n/a |
| Traders management | None found | n/a |

Two screens had a real, specific, same-root-cause gap; both were fixed
and re-verified live in this session, not just logged for later.
