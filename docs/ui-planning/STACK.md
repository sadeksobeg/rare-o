# Design-lab stack (post checkpoint-2 pivot)

The owner's checkpoint-2 verdict ("IMPROVED, NOT ACCEPTED") identified the
build *method* itself — hand-drawing every control in static HTML — as the
root cause of the mockups reading as primitive. The static CDN-script stack
below this heading (`docs/ui/design/mockups/`, Wave 0/1) is superseded by a
real, isolated Next.js workspace: `design-lab/` at the repo root. It is not
part of the production app ("Project A") and must not be imported by it;
`turbopack.root`/`outputFileTracingRoot` in `design-lab/next.config.ts` pin
its dev server to its own tree so it cannot read Project A's `middleware.ts`
or `layout.tsx` (a real cross-contamination bug found and fixed in this
round — see `design-lab/next.config.ts`).

This stack is meant to be ported into the real app once the owner approves
a checkpoint, per `docs/ui-planning/VISION.md`.

## Runtime

| Package | Version | Role |
|---|---|---|
| Next.js | 16.4.3 (App Router, Turbopack) | Framework |
| React | 19.3.0 | UI runtime |
| Tailwind CSS | v4 (CSS-first `@theme inline`) | Styling — real PLAN.md tokens ported as `--color-ro-*` custom properties in `app/globals.css`, remapped onto shadcn's semantic token names for light and the PLAN.md `.ro-inverse` dark palette |
| TypeScript | ^5 | Types |

## Component layer

| Package | Role | Why this one |
|---|---|---|
| shadcn/ui (`shadcn` CLI, `radix-ui`) | Base primitives — Button, Input, Dialog, AlertDialog, Dropdown, Table, Tabs, Sheet, Sidebar, Select, Switch, Progress, Avatar, Badge, Command, Chart wrapper | Accessible-by-default Radix primitives, owns its own source in `components/ui/` (no black-box runtime dependency), ships RTL support (`--rtl`, `components/ui/direction.tsx`) |
| Magic UI (`@magicui` shadcn registry) | NumberTicker, MagicCard, ShimmerButton, ShineBorder, Marquee, BentoGrid, DotPattern, Particles | Polished, pre-animated components instead of hand-building count-ups and card treatments from scratch — this was the owner's explicit instruction |
| Aceternity UI (`@aceternity` shadcn registry) | AuroraBackground (recolored to plum/amber brand tokens), AnimatedBeam, 3D Card, TextGenerateEffect, AuroraText | Same rationale — premium animated primitives, customized to brand rather than authored by hand |
| `lucide-react` | Icons | D15's existing rule (stroke 1.5); this is now a real npm dependency, not a hand-matched `icons.js` shim |

## Motion / 3D / data

| Package | Role | Why this one |
|---|---|---|
| `motion` (Motion for React, the framer-motion successor), imported as `motion/react` | Word-by-word headline reveals, view transitions (login form ↔ forgot ↔ success) | Declarative, works cleanly with React 19 |
| `gsap` + `ScrollTrigger` | Reserved for scroll-choreographed sequences (storefront story reveals) | Same rationale as the superseded stack below — industry-standard damped easing |
| `three`, `@react-three/fiber`, `@react-three/drei` | The real RARE OUD logo as a lit, rotating 3D object — login hero and storefront hero (`components/brand/logo-scene.tsx`) | The owner explicitly required Three.js after checkpoint 1 rejected the line-art-only treatment. The logo SVG (vectorized from `public/brand/mark-master.png` via `scripts/trace-logo.mjs`, potrace) is extruded and lit. The camera is fit to the model's bounding **sphere** with 22% padding — not a fixed distance — which is the actual fix for the clipping the owner flagged at checkpoint 3; a fixed distance only cleared the silhouette's flattest axis, not its rotated extremes. `prefers-reduced-motion` falls back to the static flat SVG mark. |
| `recharts` (via shadcn's `ChartContainer`) | Admin dashboard area/donut charts, themed to `--color-ro-*` tokens | Already shadcn-wrapped, avoids re-solving chart theming by hand |
| `sonner` | Toast feedback (password reset, team status changes, etc.) | shadcn's standard toast choice |

## Fonts

Unchanged from D4/PLAN.md: Amiri, Cormorant Garamond, IBM Plex Sans Arabic,
Source Sans 3 — loaded as real `next/font/google` fonts in
`design-lab/app/layout.tsx`, not CDN `<link>` tags.

## Security-sensitive demo code

`design-lab/lib/temp-password.ts` generates a demo-only temporary password
with `crypto.getRandomValues`. It exists to make the owner's password-reset
pattern (admin resets → system generates a temp password → shown once →
trader forced to change it at next sign-in, admin never sees the real
password) demonstrable end-to-end in `/admin/traders` and
`/force-password-change`. In the real app this generation, hashing, and
single-display behavior must happen server-side.

---

## Superseded: static-mockup CDN stack (Wave 0/1, `docs/ui/design/mockups/`)

Kept for reference only; no longer the build target.

| Library | Source | Role |
|---|---|---|
| GSAP core + ScrollTrigger | `cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/` | Choreographed entrance sequences, scroll-driven reveals |
| Chart.js 4 | `cdn.jsdelivr.net/npm/chart.js` | Admin dashboard charts |
| Google Fonts | `fonts.googleapis.com` | D4 typefaces via `<link>` |
| Hand-matched `icons.js` | Committed in `9346dc6` | Lucide-compatible icon shim for the static mockups |

Deliberately not used in that round: Three.js (offered as optional, not required at the time), Lottie, a CDN lucide runtime. All three are now real dependencies of `design-lab/` per the checkpoint-2/3 pivot above.
