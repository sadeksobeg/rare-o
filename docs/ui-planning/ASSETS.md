# Assets used in the design-lab rebuild (checkpoint-2/3 pivot)

All real brand photography/emblem files listed below were copied from this
repo's `public/brand/` into `design-lab/public/brand/` (same files, same
licensing — this is still the project's own asset library, not a new
sourcing pass). They now cover: the login/storefront 3D logo hero, the
storefront craft-story section, the storefront collections grid, and the
trader-home task cards and offers carousel — every photographic spot built
this round.

The owner's checkpoint-3 feedback named Unsplash/Pexels as permitted
sources for additional imagery if the existing library runs short. It
did not run short this round: every section built had a matching real
asset already in `public/brand/`, so no new external image was fetched.
This is noted here rather than silently claimed as "more imagery added" —
if a future round needs imagery beyond what's listed below (e.g. distinct
photography per catalog category, or trader-specific photography), that's
the point to actually use the Unsplash/Pexels permission and log the
source + license per file here.

| Asset | Used in design-lab for |
|---|---|
| `mark-master.png` → `logo-mark.svg` (re-traced this round, `optTolerance: 0.05`) | 3D logo hero (`components/brand/logo-scene.tsx`), login + storefront |
| `mark-small.png` → `logo-mark-small.svg` | Admin sidebar mark, trader topbar mark, storefront nav mark |
| `hero-oud-atelier-a.jpg` | Trader-home "اقترح صفقة" task card |
| `hero-oud-atelier-b.jpg` | Trader-home "اطلب بالجملة" task card |
| `hero-closeup.jpg` | Trader-home "اطلب وساطة" task card; storefront craft-story photo |
| `hero-oud-majestic.jpg` | Trader-home offers carousel ("مختارات وترية"); storefront collections ("قانون وآلات وترية") |
| `instrument-dark.jpg` | Trader-home offers carousel ("تحرير الأتيليه") |
| `oud-heritage.jpg` | Trader-home offers carousel ("إرث العود"); storefront collections ("قطع نادرة معتّقة") |
| `hero-oud-resonance.jpg` | Storefront collections ("عود كلاسيكي") |

---

# Assets used in Wave 1 rework (VISION.md checkpoint 2) — superseded, kept for history

## Real brand assets found in-repo (not stock, already the project's own)

The checkpoint feedback assumed no real logo or photography existed. A search of `public/brand/` before fetching anything external found the project's actual assets, already licensed to this project:

| Asset | Source path | Used as |
|---|---|---|
| Emblem (master) | `public/brand/mark-master.png` (611×611, 2-tone) | Vectorized to `docs/ui/design/mockups/assets/logo-mark.svg` via `potrace` (`scripts/trace-logo.mjs`, pure-JS, no network asset fetch) — the real wood-grain/resonance mark, not the placeholder concentric circles used in the previous round |
| Emblem (small) | `public/brand/mark-small.png` | Vectorized to `assets/logo-mark-small.svg` |
| Product photography | `public/brand/hero-oud-resonance.jpg`, `hero-oud-majestic.jpg`, `hero-oud-atelier-{a..f}.jpg`, `hero-stage-oud.jpg` | Full-instrument studio shots, dramatic plum/amber lighting already matching the token palette exactly |
| Editorial photography | `public/brand/editorial/hero-closeup.jpg`, `hero-signature.jpg`, `instrument-dark.jpg`, `oud-heritage.jpg` | Macro rosette/wood-grain detail shots |
| Texture | `public/brand/editorial-wood-grain.jpg` / `.webp`, `atmosphere-{resin,shadow,wood}.svg` | Background texture layers |

These are copied (not symlinked) into `docs/ui/design/mockups/assets/` so the static mockups stay self-contained and don't reach into `public/`. No photography, video, or 3D model was downloaded from Unsplash, Pexels, Coverr, Sketchfab, or Poly Haven — real, already-licensed project assets covered the need.

## Libraries (CDN, recorded per VISION.md section 3)

| Library | Source | Role |
|---|---|---|
| GSAP core + ScrollTrigger | cdnjs (pinned 3.12.5) | Unchanged from Wave 0 |
| GSAP SplitText, DrawSVGPlugin, MorphSVGPlugin, ScrollSmoother, Flip | `unpkg.com/gsap@latest/dist/*.js` | Confirmed loading and registering (checked live before use, not assumed) — these were Club GreenSock-only plugins before GSAP's 2024 license change; they are not on the version-pinned cdnjs build yet, so these five load from unpkg's `@latest` specifically |
| Three.js + SVGLoader | `unpkg.com/three@0.160.0/...` | The login and storefront "wow moment": the real vectorized logo mark, extruded into a 3D object and lit/rotated in-browser — not a downloaded glTF. This was a deliberate choice over sourcing a third-party 3D oud model: downloading a specific external model (Sketchfab/Poly Haven) is a file-download action: this session asks before fetching files from outside the project, states what and from where, and proceeds on a yes. That question hasn't been put to the owner yet, so the 3D moment is built from the brand's own real mark instead of pausing the whole checkpoint on it — a generic stock 3D oud would also not be *this* project's instrument. If the owner wants a sourced 3D oud model instead/also, say which source and license and it gets fetched next round.
| Chart.js | jsdelivr (pinned 4.4.4) | Unchanged from Wave 0, restyled with gradient fills/glow per this round's direction |

## Deliberately still not used, and why

- **Lottie / dotLottie** — no specific licensed `.json` file has been named by the owner; lottie-web itself loads fine from CDN (checked), but the animation files are exactly the kind of external asset this session does not fetch without the owner naming a source. Small success/loading moments are built as hand-authored SVG + GSAP (morphing checkmark, logo-shaped pulse loader) instead, which achieves the same visual goal without an unverified external download.
- **Stock video loops (Pexels/Coverr)** — the real photography above covers every spot VISION.md's wow-moments list a video for, via GSAP-driven slow zoom/pan ("Ken Burns") on the actual product shots instead. Real photography of the actual product beats generic stock footage of a different instrument anyway.
- **Spline** — not evaluated; Three.js directly on the real logo mark covers the one signature 3D moment this wave needs without adding a second 3D runtime.
