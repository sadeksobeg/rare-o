# Mockup stack v3 (Wave 0+)

Libraries loaded from CDN in the static mockups, for the Next.js build to mirror later. Recorded per VISION.md section 3.

| Library | Source | Role | Why this one |
|---|---|---|---|
| GSAP core + ScrollTrigger | `cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/` | Choreographed entrance sequences (login, dashboard), scroll-driven reveals (storefront home) | Industry standard for damped, physical easing; small core; ScrollTrigger covers the storefront's cinematic scroll without a second scroll library |
| Chart.js 4 | `cdn.jsdelivr.net/npm/chart.js` | Admin dashboard: requests-over-time area chart, pipeline donut | Themeable to brand tokens via plugin config, animates on draw-in natively, far lighter than ECharts for the two chart types actually needed here |
| Google Fonts | `fonts.googleapis.com` | Amiri, Cormorant Garamond, IBM Plex Sans Arabic, Source Sans 3 | Unchanged from D4/PLAN.md — typography is not in dispute, only its scale and usage |

## Deliberately not used (and why)

- **Three.js** — VISION.md offers it for "one signature moment," not as a requirement. A WebGL rosette/soundhole scene adds real risk (load time, GPU variance, a fallback image to maintain) for a mockup whose job is to lock a *direction*, not ship a product. The login and storefront hero instead get a layered SVG + CSS + GSAP "brand scene" (resonance rings that redraw and idle-pulse, an animated grain-noise overlay, a slow waveform line, a radial light sweep) — same physical ideas from section 2.1, built with primitives that are instant to load, have no GPU dependency, and already respect `prefers-reduced-motion` the same way the rest of the motion system does. Three.js stays open for a later wave if a specific screen clearly needs it.
- **Lottie** — success/empty states are built as SVG + CSS/GSAP instead, so they share the same token system, color automatically with the active language direction, and don't require authoring `.json` animation files outside this toolchain for a mockup phase.
- **A real lucide runtime (CDN or npm)** — `icons.js` (committed in `9346dc6`) already hand-matches lucide's stroke-1.5, 24px-grid geometry for every icon used. Wave 0 extends that same file with the brand glyphs VISION.md section 3 asks for (rosette, peg, string, grain, wood, handcrafted, compass/broker, loupe/inspection) rather than mixing a CDN icon runtime with hand-drawn brand glyphs. D15's actual rule ("lucide-react, stroke 1.5") is a Next.js app dependency decision for Phase 3+; these are static reference mockups, and `icons.js` is pixel-compatible with it. PLAN.md's dependency *restriction* is one of the items VISION.md explicitly supersedes for this phase, so this is a choice, not a workaround.
- **View Transitions API** — used on the login → dashboard hand-off (section 5.1) where it's a one-line win with no new dependency; not used elsewhere yet to keep Wave 1 scope contained to the four signature screens.
