# Week 1 — Brand-Aligned Visual Design

**Brand:** RARE OUD  
**Personality:** Premium · Cultural · Intelligent  
**Direction:** Modern minimalism with cultural depth  
**Applies to:** Storefront · Trader deals / negotiation · WhatsApp inbox · Wholesale flows · Admin chrome  
**Revision:** Clarified curated commercial-offer presentation (anti flash-sale); bilingual AR/EN visual readiness.

---

## 1. Brand promise in the interface (plain language)

The interface should feel like a refined house of rare string instruments and related accessories — calm, precise, and culturally rooted — **not** a generic luxury fashion site, perfume brand, multi-seller bazaar, **or discount / flash-sale store**.

Heritage appears through **material photography, typography, spacing, and quiet color**, not ornaments, gold flourishes, or literal instrument icons as decoration.

---

## 2. Core color system (confirmed)

| Token | Name | Hex | Role |
|-------|------|-----|------|
| `--ro-near-black` | Near Black | `#0B080D` | Primary text, strong surfaces, headers |
| `--ro-deep-purple` | Deep Blackened Purple | `#32104F` | Accent actions, focus, key markers |
| `--ro-warm-ivory` / `--ro-cream` | Warm Cream | `#F4E7D8` | Primary page background, airy panels (aligned with identity case study + implementation) |

### Derived supporting tones (implementation consistency — not a second brand palette)

| Token | Suggested value | Role |
|-------|-----------------|------|
| `--ro-ink-muted` | `#0B080D` at ~64% opacity | Secondary text |
| `--ro-line` | `#0B080D` at ~12% opacity | Quiet dividers |
| `--ro-surface-elevated` | Soft `#EFE3D4` (`--ro-surface`) | Forms, tables, elevated panels |
| `--ro-success` | Deep desaturated green | Agreed / shipped |
| `--ro-warning` | Muted amber | Under review / awaits response |
| `--ro-danger` | Deep desaturated red | Errors / hard system failures only — **not** “deal rejected” branding |
| `--ro-chat-in` | Soft ivory panel | Inbound WhatsApp bubble |
| `--ro-chat-out` | Light wash of `#32104F` (~8%) | Outbound bubble |

**Avoid:** gold, metallic gradients, purple-to-pink glows, heavy drop shadows, candy status colors, **loud red/yellow SALE colors**, neon urgency.

---

## 3. Typography

**Goal:** Intelligent and cultural; **Arabic RTL + English LTR** first-class.

| Role | Recommendation | Notes |
|------|-----------------|-------|
| Display / brand | Distinctive display with strong Arabic + Latin support | Not Inter/Roboto/Arial as brand voice |
| UI / body | Clean bilingual sans for tables/forms | Excellent Arabic & Latin numerals |
| Pairing | One display + one UI workhorse | No three+ family clutter |

**Assumption A-TYPO:** Final font files from RARE OUD emblem/logo package when provided.

**Spacing voice:** Generous on storefront; denser but breathable in admin/inbox. Prefer whitespace over boxes.

---

## 4. Logo & emblem usage

- Existing RARE OUD emblem/logo direction = primary reference.  
- Storefront: emblem + wordmark as hero-level brand signal.  
- Trader / Admin: compact mark in chrome.  
- No gold/metallic recolors.  

**Risk flag:** Logo masters not in workspace at Week 1 → **client asset handoff required** before Week 2 visual implementation.

---

## 5. Imagery direction

| Do | Don’t |
|----|-------|
| Real instrument & material photography | Perfume/jewelry “luxury lifestyle” stock |
| Natural materials, restrained lighting | Neon / club lighting |
| One dominant home image plane | Hero collages / mosaics |
| Cultural depth via material honesty | Decorative literal oud illustrations |
| Calm, credible commercial photography for offers | Flash-sale banners, burst badges, countdown graphics |

---

## 6. Curated deals & commercial presentation (confirmed direction)

Deals and public offers must feel:

- **curated**
- **serious**
- **premium**
- **commercially credible**

They must **not** resemble:

- discount stores  
- flash-sale websites  
- bargain marketplaces  
- coupon / “% OFF!!” carnival UI  

### Practical rules

- Prefer quiet typographic markers (“Offer” / “عرض” or equivalent curated label) over ribbons, starbursts, and stickers.  
- Do **not** use aggressive “SALE” language as default chrome.  
- Do **not** use countdown-heavy sales patterns.  
- Do **not** use loud discount color systems (hot red/orange sale kits).  
- Conditions copy should read like serious commercial terms, not hype.  
- Percentage callouts, if ever shown, stay typographically restrained — never the visual hero.  
- Trader identity never appears as a public seller brand mark.

---

## 7. Components — visual rules across surfaces

### 7.1 General

- **Default: no cards** on marketing/storefront hero.  
- Panels allowed when they contain interaction (cart lines, negotiation rows, inbox list, forms).  
- Subtle radius; hairline borders; no gradient brand decoration.  
- Primary button: `--ro-deep-purple`; secondary: quiet outline.

### 7.2 Storefront

- Ivory canvas; purple for primary CTAs and restrained offer markers.  
- Category browsing for **String musical instruments** and **Accessories** only at launch.  
- Language switcher visually quiet but always available (AR | EN).

### 7.3 Trader negotiation board

- Same product family tokens.  
- Status markers: flat, desaturated, text+dot — labels for under review / counter-terms / agreed / closed* (*OPEN).  
- Avoid red “Rejected” chip as a primary brand pattern.  
- Tables/lists over dashboard spectacle.

### 7.4 WhatsApp inbox (admin)

- Utility-first; same palette; single Admin operator chrome (no staff-switcher UI at launch).

### 7.5 Wholesale flow

- Same sober form language as deal proposal (“commercial request,” not “deal hunt”).

---

## 8. Motion (intentional, minimal)

Later build (2–3 purposeful motions):

1. Page enter (storefront)  
2. Add-to-cart confirmation  
3. Inbox thread open (mobile)  

No particle glows, no sale-ticker motion, no urgency pulse on prices.

---

## 9. Surface application checklist

| Surface | Background | Primary CTA | Identity |
|---------|------------|-------------|----------|
| Storefront | Ivory | Purple | Full RARE OUD |
| Offers | Ivory | Purple | RARE OUD curated only |
| Trader portal | Ivory / elevated | Purple | RARE OUD + Trader |
| Admin + Inbox | Ivory / elevated | Purple | RARE OUD Admin |
| Wholesale | Trader portal family | Purple | RARE OUD as supplier brand |

---

## 10. Explicitly will not design visually

- Gold foil / metallic luxury kitsch  
- Gradient meshes as identity  
- Seller avatars on product cards  
- Commission / earnings skins  
- Payment-brand button rows  
- Overdecorated arabesque chrome  
- Flash-sale badges, countdown bars, bargain-store colorways  

---

## 11. Handoff needs before Week 2

1. Final logo/emblem files + any brand type guidelines.  
2. 4–8 approved product photos.  
3. Confirmation of A-TYPO if a brand typeface already exists.  

*(Language AR+EN is now **confirmed** — no longer a bilingual open question.)*

---

## 12. Identity notes — as-built (2026-10-18)

| Topic | As-built | Owner action |
|-------|----------|--------------|
| Logo / emblem | PNG paths `/brand/mark-master.png`, `/brand/mark-small.png` in `components/brand/emblem.tsx` | Deliver **A1/A2 SVG** — see [OWNER-ASSETS.md](../pro-readiness/OWNER-ASSETS.md) |
| Color tokens | CSS variables in `app/globals.css` (sand/ink/plum/cream family) | Confirm cream `#F4E7D8` vs any print brand book delta |
| Typography | Cormorant, Amiri, Source Sans 3, IBM Plex Sans Arabic in `app/layout.tsx` | Confirm A-TYPO or approve web stack |
| Brand motifs | Rings, grain, axis, emblem components in `components/brand/` | A7 **done** in code |
| Photography | Mix of `public/brand/hero-*`, editorial JPGs, Material Plate for missing SKU shots | **A5/A6** owner shoots |
| Privacy / legal chrome | Placeholder banner + section bodies in `dict.privacy` | Counsel-approved AR/EN copy |
| Curated / anti–flash-sale | Offer markers quiet; no trader logos on storefront cards | Keep for launch QA |

**Single-brand rule holds:** one RARE OUD house publicly; trader identity only inside trader/admin tools.

---

## Stage 4 summary (revised)

**Confirmed:** Palette and personality unchanged; deals must look curated/serious/premium — never discount-store; AR+EN visual readiness; anti flash-sale rules explicit.  
**Assumptions:** Supporting tones; typefaces pending asset pack.  
**Open:** Logo/type handoff only (visual).  
**Plain-language takeaway:** Every surface — including offers — should feel like one intelligent RARE OUD house, not a sale site or a marketplace of sellers.
