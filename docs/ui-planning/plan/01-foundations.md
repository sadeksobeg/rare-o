# 01 — Foundations

## 1. Creative direction

**"Quiet luxury, craft-led."** The instrument is the hero; the interface recedes. Calm, warm, precise, tactile.

### 1.1 The four brand pillars become four design obligations

| Emblem pillar | Emblem part | UI obligation |
|---|---|---|
| Rare material | Organic black mass | Real material in imagery (macro wood, rosette). No decorative gradients standing in for material |
| Craftsmanship | Straight vertical line | A precise grid, hairlines, one vertical axis motif. Everything aligns |
| Resonance | Fine internal lines | Motion behaves like sound: slow, damped, radiating. Never bouncy |
| Heritage | Circular void (rosette) | Concentric ring motif and Arabic calligraphic display type |

### 1.2 Principles

1. **Instrument first.** Product imagery dominates every commercial screen.
2. **Material honesty.** No stock photos, no fake inventory, no fake metrics.
3. **Precision.** 4 px grid, hairline borders, consistent alignment.
4. **Resonance.** Motion is damped oscillation or radiating rings.
5. **Arabic-first.** Layouts are designed in RTL and mirrored to LTR, not the reverse.
6. **Calm density.** Storefront is airy; admin is dense but quiet.
7. **One next action per screen.** A single primary button.
8. **Honest states.** Loading, empty, error, and offline are designed, not defaults.

### 1.3 What this direction is not (forbidden)

Gold gradients, ornamental arabesque clip-art, stock oud silhouettes, glassmorphism, neon or glow outside the hero, bouncing or elastic easing, emoji in UI, cartoon icons, countdown timers, fake scarcity labels, payment-card icons.

---

## 2. Signature motifs

| Motif | Meaning | Where it appears | Where it must not |
|---|---|---|---|
| **Resonance rings** (concentric circles) | Rosette, sound radiating | Hero visual, empty states, loaders, press ripple, success states | Behind body text; in admin tables |
| **Grain lines** (wavy hairlines) | Wood grain | Section dividers, Material Plate, hero texture at 6% opacity, footer | Over form fields |
| **Axis** (vertical hairline, 1 px) | Craft precision | Hero scroll cue, editorial split divider, admin sidebar active indicator | More than once per screen |

### 2.1 Reference geometry (tune visually in `/dev/ui`, keep proportions)

**Rings** — `viewBox="0 0 400 400"`, circles centered at 200,200 with radii `190, 150, 112, 78, 48, 22`; `fill="none"`, `stroke="currentColor"`, `stroke-width="1"`, `vector-effect="non-scaling-stroke"`, opacities `0.9, 0.7, 0.55, 0.42, 0.32, 0.22`.

**Grain tile** — tileable `240×96`:

```svg
<pattern id="ro-grain" width="240" height="96" patternUnits="userSpaceOnUse">
  <g fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke">
    <path d="M0 12 C40 4,80 20,120 12 S200 4,240 12"/>
    <path d="M0 30 C40 22,90 38,130 30 S210 22,240 30"/>
    <path d="M0 48 C30 40,70 56,120 48 S200 40,240 48"/>
    <path d="M0 66 C50 58,90 74,130 66 S210 58,240 66"/>
    <path d="M0 84 C40 76,80 92,120 84 S200 76,240 84"/>
  </g>
</pattern>
```

Components: `components/brand/rings.tsx`, `components/brand/grain.tsx`, `components/brand/axis.tsx`.

---

## 3. Color

### 3.1 Core palette

| Token | Hex | Role |
|---|---|---|
| `sand-50` | `#FBF6EE` | Raised surfaces (cards, inputs) |
| `sand-100` | `#F4E7D8` | **Canvas (brand cream, approved)** |
| `sand-200` | `#EFE3D4` | Sunken panels (approved "surface") |
| `sand-300` | `#E3D6C5` | Dividers on sunken, neutral chip bg |
| `sand-400` | `#D2C2AC` | Strong divider, skeleton base |
| `ink-950` | `#0B080D` | **Brand near-black**: text, primary button, hero |
| `ink-900` | `#15101A` | Inverse raised surface |
| `ink-800` | `#211A29` | Material Plate, admin sidebar hover |
| `ink-700` | `#332A3C` | Inverse borders on dark panels |
| `ink-600` | `#4B4056` | Secondary text on light |
| `ink-500` | `#5A4F66` | Muted text on light |
| `ink-400` | `#6B6074` | Muted text on raised only |
| `ink-300` | `#A79DB3` | Muted text on dark |
| `ink-200` | `#B9AFC4` | Secondary text on dark |
| `plum-900` | `#32104F` | **Brand deep purple**: links, focus, brand bands |
| `plum-800` | `#3F1962` | Primary button hover |
| `plum-700` | `#52277C` | Link hover |
| `plum-300` | `#C9B2E3` | Accent text on dark |
| `plum-100` | `#E9DDF3` | Info chip bg, selected row |
| `plum-50` | `#F5EFFA` | Subtle selected bg |
| `amber-500` | `#B8863F` | Accent on dark only (hairlines, small glyphs) |
| `amber-400` | `#CFA25E` | Accent on dark, hover |
| `amber-600` | `#8A5A22` | Accent text on light (≥ 14 px, weight 600) |
| `amber-100` | `#F1E0BF` | Attention chip bg |

**Amber rule:** at most 2% of any screen's area. Never `amber-500/400` on light backgrounds (contrast 2.65:1).

### 3.2 Semantic roles

| Role | Light surfaces | Dark surfaces |
|---|---|---|
| Page background | `sand-100` | `ink-950` |
| Raised | `sand-50` | `ink-900` |
| Sunken | `sand-200` | `ink-950` |
| Text | `ink-950` | `sand-100` |
| Text secondary | `ink-600` | `ink-200` |
| Text muted | `ink-500` | `ink-300` |
| Link | `plum-900` (underline) | `plum-300` |
| Border subtle (decorative) | `rgba(11,8,13,.14)` | `rgba(244,231,216,.16)` |
| Border strong | `rgba(11,8,13,.28)` | `rgba(244,231,216,.30)` |
| Border control (inputs) | `#8F8473` | `#7C7288` |
| Focus ring | `plum-900` | `sand-100` |

### 3.3 Status tones (chips, banners)

| Tone | Bg | Text | Icon (lucide) | Meaning |
|---|---|---|---|---|
| neutral | `sand-300` | `ink-600` | `circle-dashed` | Draft, not started |
| info | `plum-100` | `plum-900` | `circle-dot` | New, submitted |
| progress | `#D9E6EE` | `#1F3F57` | `loader-circle` (static) | In progress, negotiating |
| attention | `amber-100` | `amber-800 #6B4614` | `circle-alert` | Waiting on you |
| success | `#DCEBDD` | `#1F5130` | `circle-check` | Accepted, completed, connected |
| danger | `#F4DADC` | `#8A2433` | `circle-x` | Rejected, failed, disconnected |
| closed | `#E6E0EA` | `ink-500` | `archive` | Cancelled, closed, archived |

Never convey status by color alone: icon + text always present.

### 3.4 Verified contrast (WCAG ratios, computed)

| Pair | Ratio | Use |
|---|---|---|
| `ink-950` on `sand-100` | 16.37 | Body |
| `ink-600` on `sand-100` | 7.97 | Secondary text |
| `ink-500` on `sand-100` | 6.29 | Muted (≥ 14 px) |
| `ink-500` on `sand-50` | 7.11 | Muted on cards |
| `plum-900` on `sand-100` | 13.06 | Links |
| `sand-100` on `ink-950` | 16.37 | Dark sections |
| `ink-200` on `ink-950` | 9.47 | Secondary on dark |
| `ink-300` on `ink-900` | 7.24 | Muted on dark |
| `plum-300` on `ink-950` | 10.39 | Accent text on dark |
| `amber-600` on `sand-100` | 4.84 | Overline only |
| `amber-400` on `ink-950` | 8.52 | Accent on dark |
| `#8F8473` on `sand-50` | 3.41 | Input border (≥ 3:1) |
| Status tone text/bg pairs | 5.9 – 12.2 | All ≥ 4.5 |

Disabled text is exempt (about 2.9:1) but must carry `aria-disabled` and a visual cue beyond color.

---

## 4. Token block (paste into `app/globals.css`, replacing the current `:root`)

```css
:root {
  /* sand */
  --ro-sand-50:#FBF6EE; --ro-sand-100:#F4E7D8; --ro-sand-200:#EFE3D4; --ro-sand-300:#E3D6C5; --ro-sand-400:#D2C2AC;
  /* ink */
  --ro-ink-950:#0B080D; --ro-ink-900:#15101A; --ro-ink-800:#211A29; --ro-ink-700:#332A3C;
  --ro-ink-600:#4B4056; --ro-ink-500:#5A4F66; --ro-ink-400:#6B6074; --ro-ink-300:#A79DB3; --ro-ink-200:#B9AFC4;
  /* plum */
  --ro-plum-900:#32104F; --ro-plum-800:#3F1962; --ro-plum-700:#52277C; --ro-plum-300:#C9B2E3; --ro-plum-100:#E9DDF3; --ro-plum-50:#F5EFFA;
  /* amber */
  --ro-amber-800:#6B4614; --ro-amber-600:#8A5A22; --ro-amber-500:#B8863F; --ro-amber-400:#CFA25E; --ro-amber-100:#F1E0BF;
  /* semantic */
  --ro-success-700:#1F5130; --ro-success-100:#DCEBDD;
  --ro-danger-700:#8A2433;  --ro-danger-100:#F4DADC;
  --ro-progress-700:#1F3F57; --ro-progress-100:#D9E6EE;

  /* roles (light) */
  --ro-bg:var(--ro-sand-100); --ro-bg-raised:var(--ro-sand-50); --ro-bg-sunken:var(--ro-sand-200);
  --ro-text:var(--ro-ink-950); --ro-text-2:var(--ro-ink-600); --ro-text-muted:var(--ro-ink-500);
  --ro-link:var(--ro-plum-900); --ro-link-hover:var(--ro-plum-700);
  --ro-border-subtle:rgba(11,8,13,.14); --ro-border:rgba(11,8,13,.28); --ro-border-control:#8F8473;
  --ro-focus:var(--ro-plum-900);

  /* space (4px base) */
  --ro-s-1:4px; --ro-s-2:8px; --ro-s-3:12px; --ro-s-4:16px; --ro-s-5:20px; --ro-s-6:24px; --ro-s-8:32px;
  --ro-s-10:40px; --ro-s-12:48px; --ro-s-16:64px; --ro-s-20:80px; --ro-s-24:96px; --ro-s-32:128px; --ro-s-40:160px;

  /* shape */
  --ro-r-xs:2px; --ro-r-sm:4px; --ro-r-md:8px; --ro-r-lg:16px; --ro-r-full:9999px;

  /* elevation */
  --ro-e2:0 1px 2px rgba(11,8,13,.06), 0 8px 24px -12px rgba(11,8,13,.18);
  --ro-e3:0 24px 64px -24px rgba(11,8,13,.45);

  /* motion */
  --ro-dur-instant:90ms; --ro-dur-fast:160ms; --ro-dur-base:240ms; --ro-dur-slow:420ms; --ro-dur-enter:700ms; --ro-dur-hero:1100ms;
  --ro-ease-standard:cubic-bezier(.2,0,0,1);
  --ro-ease-enter:cubic-bezier(.16,1,.3,1);
  --ro-ease-exit:cubic-bezier(.4,0,1,1);
  --ro-ease-resonance:cubic-bezier(.37,0,.63,1);
}

.ro-inverse { /* any dark section: hero, trader band, footer, admin sidebar */
  --ro-bg:var(--ro-ink-950); --ro-bg-raised:var(--ro-ink-900); --ro-bg-sunken:var(--ro-ink-950);
  --ro-text:var(--ro-sand-100); --ro-text-2:var(--ro-ink-200); --ro-text-muted:var(--ro-ink-300);
  --ro-link:var(--ro-plum-300); --ro-link-hover:var(--ro-sand-100);
  --ro-border-subtle:rgba(244,231,216,.16); --ro-border:rgba(244,231,216,.30); --ro-border-control:#7C7288;
  --ro-focus:var(--ro-sand-100);
}

/* language-driven type system */
html[lang="ar"] {
  --ro-font-display:var(--font-amiri), var(--font-cormorant), serif;
  --ro-font-ui:var(--font-plex-ar), var(--font-source), system-ui, sans-serif;
  --ro-display-weight:400; --ro-display-scale:.94; --ro-ui-scale:1.06;
  --ro-lh-body:1.8; --ro-lh-heading:1.35; --ro-track-overline:0;
}
html[lang="en"] {
  --ro-font-display:var(--font-cormorant), var(--font-amiri), serif;
  --ro-font-ui:var(--font-source), var(--font-plex-ar), system-ui, sans-serif;
  --ro-display-weight:500; --ro-display-scale:1; --ro-ui-scale:1;
  --ro-lh-body:1.6; --ro-lh-heading:1.12; --ro-track-overline:.14em;
}
```

Tailwind v4 mapping (extend the existing `@theme inline`): expose `--color-ro-canvas`, `--color-ro-paper`, `--color-ro-sunken`, `--color-ro-ink`, `--color-ro-plum`, `--color-ro-amber`, plus `--color-ro-text`, `--color-ro-text-2`, `--color-ro-muted`, `--color-ro-border`. Keep legacy aliases `ro-cream → sand-100`, `ro-purple → plum-900`, `ro-near-black → ink-950` until Phase 7, then delete them.

**Calibration rule:** only `--ro-display-scale` and `--ro-ui-scale` may be tuned after visual review in `/dev/ui`. Nothing else in the type system changes.

---

## 5. Typography

### 5.1 Families (via `next/font/google`, `display: "swap"`)

| Variable | Family | Weights | Subsets |
|---|---|---|---|
| `--font-cormorant` | Cormorant Garamond | 500, 600 | latin |
| `--font-amiri` | Amiri | 400, 700 | arabic, latin |
| `--font-source` | Source Sans 3 | 400, 600 | latin |
| `--font-plex-ar` | IBM Plex Sans Arabic | 400, 500, 600 | arabic |

Preload only the display font of the active locale. All four are open-licensed for commercial use.

### 5.2 Scale (size = value × role scale for Arabic)

| Role | Size (clamp) | Font | Weight AR/EN | Line-height AR/EN | Use |
|---|---|---|---|---|---|
| display-xl | `clamp(3rem, 2rem + 5vw, 6.5rem)` | display | 400/500 | 1.25 / 1.02 | Hero only |
| display-lg | `clamp(2.5rem, 1.7rem + 3.6vw, 4.5rem)` | display | 400/500 | 1.3 / 1.05 | Section heroes |
| h1 | `clamp(2rem, 1.55rem + 2vw, 3.25rem)` | display | 400/500 | 1.35 / 1.1 | Page titles |
| h2 | `clamp(1.625rem, 1.35rem + 1.2vw, 2.25rem)` | display | 400/500 | 1.4 / 1.15 | Section titles |
| h3 | `clamp(1.25rem, 1.15rem + .5vw, 1.5rem)` | UI | 600 | 1.5 / 1.25 | Card titles |
| h4 | `1.125rem` | UI | 600 | 1.55 / 1.3 | Sub-blocks |
| body-lg | `1.125rem` | UI | 400 | 1.85 / 1.6 | Lead text |
| body | `1rem` | UI | 400 | 1.8 / 1.6 | Default |
| body-sm | `.875rem` | UI | 400 | 1.7 / 1.55 | Secondary |
| caption | `.8125rem` | UI | 400 | 1.65 / 1.5 | Meta |
| overline | `.75rem` | UI | 600 | 1.6 / 1.4 | Eyebrow labels |
| admin-table | `.875rem` | UI | 400 | 1.5 | Dense tables |

### 5.3 Rules

- **Arabic never gets** letter-spacing, italics, uppercase, or synthetic bold. Overline in Arabic is plain 600, not tracked.
- Overline in Latin: uppercase, tracking `.14em`.
- Max line length: 60–70 characters Latin, 50–60 Arabic.
- Headings use the display font; everything interactive uses the UI font.
- Hero headline: at most 3 lines in Arabic, at most 38 characters per line.
- Mixed content: wrap Latin names, phone numbers, URLs, and SKUs in `<bdi>`; phone/email inputs `dir="ltr"`.
- Prices and quantities use tabular numerals (`font-variant-numeric: tabular-nums`) in tables and request lines.

---

## 6. Layout and spacing

| Tier | Width | Columns | Margin | Gutter |
|---|---|---|---|---|
| Mobile | < 640 | 4 | 16 | 16 |
| Tablet | 640–1023 | 8 | 24 | 20 |
| Desktop | 1024–1535 | 12 | 40 | 24 |
| Wide | ≥ 1536 | 12, content max 1440, centered | auto | 24 |

Section vertical rhythm (storefront): 64 / 96 / 128 px (mobile / tablet / desktop). Title-to-content: 40 / 48 / 64. Admin page padding: 16 / 24 / 32. Touch targets: 44 × 44 minimum on every device.

Always use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`). No `left`/`right`.

---

## 7. Shape, borders, elevation

| Element | Radius | Border | Shadow |
|---|---|---|---|
| Buttons, inputs, chips | 4 | 1 px | none |
| Cards | 4 | subtle hairline | none; interactive storefront cards add `e2` on hover |
| Media | 2 | none | none |
| Dialogs, popovers | 8 | none | `e3` |
| Bottom sheet | 16 top corners | none | `e3` |

Depth comes first from lightness (`sand-50` on `sand-100`), then hairlines, then shadow. Only two shadows exist: `e2`, `e3`.

---

## 8. Motion

### 8.1 Tokens

Durations: instant 90, fast 160, base 240, slow 420, enter 700, hero 1100 ms. Easings: standard, enter (expo-out), exit, resonance (symmetric).

### 8.2 Patterns

| Pattern | Spec |
|---|---|
| Reveal on scroll | `translateY(12px)` + opacity 0 → 1, 700 ms enter easing, stagger 80 ms, once per element, `IntersectionObserver` threshold 0.15 |
| Hover (storefront cards) | Image scale 1.03 over 420 ms; card lift 2 px + `e2` over 240 ms |
| Press (storefront primary button) | Scale .98 over 90 ms + one resonance ring ripple (600 ms, 1 ring) from the pointer position |
| Rings idle (hero, empty states) | Opacity pulse ±8%, 8 s, ring stagger 400 ms, `resonance` easing |
| Grain draw (hero load) | `stroke-dashoffset` from full length to 0, 1100 ms, stagger 120 ms |
| Overlay open | Opacity + `translateY(8px)` 240 ms; sheet: `translateY(100%)` → 0, 420 ms |
| Admin transitions | ≤ 160 ms, opacity only, no transforms |

### 8.3 Hero choreography (desktop)

| t (ms) | Event |
|---|---|
| 0–200 | Background fade-in |
| 200–1100 | Rings draw, staggered |
| 400–1100 | Headline lines fade-up, 120 ms stagger |
| 800–1300 | Subline, then CTAs |
| ≥ 1300 | Rings idle pulse |
| scroll | Hero visual `translateY` ≤ 24 px parallax; header turns solid after 80 px |

### 8.4 Hard rules

- Animate only `transform` and `opacity`.
- `prefers-reduced-motion: reduce`: all of the above become a 120 ms opacity fade; rings static; no parallax; no ripple.
- Save-Data (`navigator.connection.saveData` or `Save-Data` header): treat as reduced motion, serve smaller hero image, skip grain draw.
- No scroll-jacking, no auto-playing video in v1, no animation longer than 1300 ms except the idle pulse.

---

## 9. Iconography

`lucide-react`, stroke 1.5, sizes 16 / 20 / 24. Color inherits text. Tree-shake by named import only.
Mirror directional icons in RTL (`rtl:-scale-x-100`): arrows, chevrons, back/forward, send. Do not mirror: clock, check, media, search, brand glyphs.

Six custom brand glyphs in `components/brand/icons/`: `rosette`, `grain`, `peg`, `string`, `wood`, `handcrafted`. Same 1.5 stroke, 24 px grid.

---

## 10. Imagery and brand assets

### 10.1 Product photography (per SKU)

| Item | Spec |
|---|---|
| Master | 2400 × 3000 px (4:5), sRGB, JPEG q ≥ 90 |
| Minimum set | 3 images; ideal 5 |
| Shots | 1 front three-quarter · 2 soundboard and rosette macro · 3 back/bowl grain · 4 neck and pegbox · 5 detail (strings/bridge) |
| Background | Seamless `ink-900` (primary). `sand-100` only for a deliberate "light" collection |
| Light | Soft key, warm rim light, no hard shadows, no props |
| Naming | `{slug}-{n}.jpg` |
| Alt text | `{product name} — {angle}`; angle names in dictionary (AR/EN) |

### 10.2 Editorial photography

Minimum 6: macro wood grain ×2, rosette ×1, hands crafting ×1, strings and pegs ×1, material/workshop ×1. Crops: 16:9 and 4:5. Text over imagery requires an `ink-950` scrim 0 → 60% and ≥ 4.5:1 verified.

### 10.3 Material Plate (honest placeholder, replaces empty boxes)

4:5 box, `ink-800` background, grain tile at 14% `sand-100`, centered `rosette` glyph at 28% opacity. Caption (overline, `ink-200`): "الصورة قيد التصوير" / "Photography in progress". Variants: `full` (with caption: cards, PDP), `compact` (no caption: cart lines, admin thumbs). On the PDP a plate appears alone, with no thumbnails and no zoom.

### 10.4 Logo usage

| Rule | Value |
|---|---|
| Versions | Master (cream on ink), ink on cream, plum on cream; small mark for ≤ 32 px |
| Clear space | 25% of emblem height on all sides |
| Minimum size | 24 px tall (use small mark below 32 px) |
| Forbidden | Stretching, rotating, recoloring outside the three versions, effects, placing on busy imagery without a scrim |

### 10.5 Launch asset deliverables

| ID | Asset | Needed by |
|---|---|---|
| A1 | Emblem as clean SVG (master, ink, cream, plum, small mark) | Before Phase 4 |
| A2 | Latin wordmark lockup "RARE OUD" SVG | Before Phase 4 |
| A3 | Favicon set + `apple-touch-icon` + 512 icon | Before Phase 7 |
| A4 | Default OG image 1200 × 630 | Before Phase 7 |
| A5 | Editorial photography set (§10.2) | Before Phase 4 |
| A6 | Product photography per §10.1 | Before launch (placeholders cover the gap) |
| A7 | Grain, rings, axis SVG components | Built in Phase 1 |
| A8 | Six custom glyphs | Built in Phase 2 |
