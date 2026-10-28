# RARE OUD — VISION v3: From Primitive to World-Class

**Place at:** `docs/ui-planning/VISION.md`
**Status:** Owner-approved. This document supersedes every *visual, motion, layout, and feature-scope* restriction in `PLAN.md` (including D2, D9, D15, D16, D18, D19, D20, and the "only lucide-react" dependency rule). `PLAN.md` remains the reference for business boundaries, data model, routes, and i18n mechanics only.
**Base:** the old mockup screens at commit `c645a60` (before `77ce8e9`). Work continues on branch `ui/mockups-rebuild-v2`. Keep infrastructure commit `9346dc6`. Treat `6783151` as optional raw material, not as the direction.

---

## 0. The mandate (read this first)

The owner's verdict on every version so far: *correct but primitive.* Flat boxes, simple shapes, no depth, no life, no wow. It looks like a template, not like a world-class brand.

Your mandate:

1. **Keep the soul of the old screens** — the information architecture, the dark sidebar + KPI + action-queue structure, the resonance rings behind the login card, the AR/EN toggle. Those were right.
2. **Rebuild everything around them to world-class level.** Every screen must gain what it is missing: elements, functions, states, micro-interactions, motion, depth, richness.
3. **You have creative freedom.** If a screen needs a new section, a new widget, a chart, a 3D element, a new screen, or a new feature to feel complete and professional — add it. Do not ask. Do not hold back. Do not choose the safe, minimal option.
4. **The owner does not want to come back and correct you.** You are the art director, the product designer, and the critic. Review your own work against §9 until it genuinely passes, before he ever sees it.
5. **Add the Brokerage feature (الوساطة)** in full — §7. The client has approved it.

**The bar:** every screen should be credible as an Awwwards / Godly / Mobbin "best of" entry. If a screenshot of it would not make a designer stop scrolling, it is not done.

---

## 1. Reference bar (study, borrow, never copy)

| Reference | What to borrow |
|---|---|
| Apple product pages (AirPods, Vision Pro) | Cinematic scroll storytelling, product as hero, light revealing material, huge confident type |
| Aesop, Le Labo, Hermès | Quiet luxury, editorial pacing, generous whitespace, tactile restraint |
| Linear | Dashboard density that still feels calm; keyboard-first; glowing focus; subtle gradients on dark |
| Stripe Dashboard | Data clarity, beautiful charts, perfect tables, empty states with personality |
| Vercel / Raycast | Command palette, crisp micro-interactions, dark UI depth with hairlines and soft glows |
| Arc / Things 3 | Delight in small moments: completion animations, satisfying toggles |
| Teenage Engineering, Leica | Precision craft aesthetic — fitting for a luthier brand |
| Monocle / Kinfolk | Editorial typography rhythm, pull quotes, image-led layouts |

Use the `frontend-design`, `design-system`, `ux-copy`, `design-critique`, and `accessibility-review` skills actively throughout — not as a checklist at the end.

---

## 2. Creative direction: "The Resonant Core — Alive"

The brand emblem is about **rare material, craft, resonance, heritage.** Version 3 makes those four ideas *physical* on screen.

### 2.1 Visual language

| Element | v3 treatment |
|---|---|
| **Depth** | Layered surfaces: deep ink backgrounds with subtle radial plum glows, raised panels with fine inner highlights (1 px top border at low-opacity cream), soft multi-layer shadows, frosted overlays where useful. No flat gray boxes anywhere. |
| **Resonance rings** | Living element, not decoration. They breathe, react to cursor proximity, ripple on clicks, pulse when new data arrives (new WhatsApp message, new request). |
| **Wood grain** | Real texture: SVG turbulence/noise or subtle photographic grain overlays on dark surfaces; animated draw-in on section dividers. |
| **Sound** | Waveform motifs: a slow waveform line in the login and dashboard header, audio-wave loaders, KPI sparklines styled as sound waves. |
| **Light** | Light sweeps across cards on hover (gradient sheen following the pointer), soft spotlight on hero product, glow on focus rings. |
| **Material** | Product imagery dominates; when missing, a rich "material plate" (wood texture + rosette + light), never an empty box. |
| **Typography** | Big, confident, editorial. Amiri / Cormorant for display at large sizes with tight rhythm; IBM Plex Sans Arabic / Source Sans 3 for UI. Kinetic type reveals (word-by-word / line-by-line) on hero moments. |

### 2.2 Palette (base, expand freely)

Core brand: Near Black `#0B080D`, Cream `#F4E7D8`, Deep Purple `#32104F`, plus Amber (oud resin) as the rare accent. You may add tints, glows, gradients, and a richer semantic palette — as long as every text pair passes contrast (§8) and the result still reads as RARE OUD.

### 2.3 Theme

Dark-luxury first for admin, trader portal, login, and storefront hero moments; warm cream canvas for long reading and storefront browsing. Add a **light/dark toggle** in admin and trader if it helps — your call.

---

## 3. Toolkit (allowed — choose what serves the result)

Mockups are static HTML; load libraries from CDN (cdnjs / jsDelivr / unpkg). Record every library in `docs/ui-planning/STACK.md` with its role, so the Next.js build later uses the same ones.

| Need | Options |
|---|---|
| Choreographed motion, scroll | GSAP + ScrollTrigger (+ SplitText alternative such as SplitType), Lenis smooth scroll on storefront |
| Component motion (later in Next.js) | Motion (Framer Motion) |
| Page/state transitions | View Transitions API |
| Charts (admin & trader) | ECharts or Chart.js or visx-style custom SVG — must be themed to the brand, animated on enter |
| 3D / WebGL accent | Three.js for one signature moment (e.g., a slowly rotating oud rosette or light through the soundhole on login / storefront hero). Must have a static fallback and pause off-screen |
| Icons | Lucide (stroke 1.5) + custom brand glyphs (rosette, peg, string, grain, wood, handcrafted, broker/compass, inspection/magnifier-loupe) |
| Lottie / SVG animation | For success states, empty states, onboarding |
| Fonts | Amiri, IBM Plex Sans Arabic, Cormorant Garamond, Source Sans 3 (add one more only if it clearly elevates the result) |

No UI kit that makes it look generic (no default Bootstrap/Material look).

---

## 4. Motion system v3

Motion is a core part of the brand ("resonance"), in every area — including admin. It must feel **damped, physical, and purposeful**, never bouncy or cheap.

| Area | Character | Examples |
|---|---|---|
| Login (all roles) | Cinematic, 1.5–2.5 s intro once | Rings draw in, waveform settles, card rises with soft blur-to-sharp, logo light sweep |
| Storefront | Cinematic storytelling | Hero choreography, scroll-driven reveals, parallax material, product image zoom-on-scroll, magnetic CTAs, cursor-reactive rings |
| Admin | Fast, precise, alive (≤ 300 ms for UI state; data animations up to 900 ms) | KPI count-up, charts drawing in, queue items sliding in, row hover highlight, live pulse on new data, toast with ring ripple, skeleton shimmer, drawer slides, command palette spring |
| Trader | Warm, rewarding | Wizard step transitions, progress fills, success celebrations (ring burst), "waiting on you" gentle pulse |

**Rules (quality floor, not restrictions):**
- Animate transform/opacity/filter/clip-path; keep 60 fps.
- Every animation has a reason: guide attention, confirm action, show change, express brand.
- Count-up and data animations must init reliably: run on `readyState` check (not only `DOMContentLoaded`), re-run on `pageshow` with `persisted`, and use IntersectionObserver for below-the-fold.
- `prefers-reduced-motion: reduce` → everything resolves to final state with ≤ 150 ms fades; WebGL replaced by static image. Must be verified live (Playwright `page.emulateMedia({ reducedMotion: 'reduce' })`, or Chrome DevTools rendering emulation, or by toggling a `data-reduced-motion` attribute in a test harness if the tool is unavailable — never "code-checked only").

---

## 5. Screen upgrade matrix

First, inventory every screen in `c645a60` and list it in `docs/ui-planning/SCREENS.md` (old name, purpose, what exists). Then upgrade each one. For every screen, deliver: **richer layout, missing elements, missing functions, all states (loading/empty/error/success/disabled), micro-interactions, and motion.** The lists below are minimums — exceed them.

### 5.1 Login (admin + trader)
- Split or immersive layout: one side a living brand scene (WebGL or layered SVG rings + grain + waveform + light), the other the form card with glass/raised depth.
- Role switch (Admin / Trader) with animated indicator, or two themed variants.
- Show/hide password with icon morph, caps-lock warning, remember device, forgot-password flow screen, rate-limit state, loading button with waveform loader, error shake (subtle, damped), success transition into the dashboard (View Transition).
- AR/EN toggle with smooth direction flip.

### 5.2 Admin dashboard
- Personal greeting + date + live status line ("واتساب متصل · آخر مزامنة قبل دقيقة").
- KPI cards with count-up, sound-wave sparklines, trend deltas, click-through to filtered lists, hover sheen.
- **Charts are allowed and expected:** requests over time (area chart), pipeline by stage (funnel), deals vs wholesale vs brokerage split (donut), conversion from request → closed.
- Action queue ("بانتظار إجراءك") with priority, age badges, quick actions inline (approve/reply/open), keyboard navigation.
- Live activity feed with avatars and pulse for new items.
- WhatsApp connection card with animated state, QR re-link entry, outbound switch.
- Brokerage widget: active inspections, awaiting quotes, commission pipeline (as entered).
- Quick-create floating menu (product, offer, trader, brokerage request).
- Command palette (Ctrl/⌘ K) with fuzzy search across records and actions.
- Responsive: collapsible sidebar with icons + tooltips; mobile drawer; no horizontal overflow at 375.

### 5.3 WhatsApp inbox
- Three-pane layout with resizable panes; mobile list → thread → context.
- Conversation rows with avatar, unread glow, linked-record chip, typing/online indicators (if data exists; otherwise design the slot).
- Rich bubbles: grouping, day separators, delivery ticks animated, reply-to, failed + retry, media placeholders with preview frame.
- Composer: quick replies / saved templates, emoji-free but with attachment and template buttons, character counter, disabled-with-reason states.
- Context panel: linked record (request / deal / wholesale / **brokerage**), customer 360 mini-card, timeline, "link to record" picker.
- New-message arrival animation and ring ripple on the sidebar badge.

### 5.4 Retail requests, Deals, Wholesale (lists + details)
- Toggle between table, cards, and **Kanban board** by status (drag between columns only through valid transitions, confirmed in a dialog).
- Saved filters, bulk actions, column chooser, sticky headers, density switch.
- Detail pages: hero header with status stepper, rich timeline, linked conversation, notes with mentions, attachments, audit trail.
- Negotiation thread for deals as a beautiful structured timeline with offer/counter cards.
- Wholesale: lines table, quote card, shipping tracker with animated route/progress.

### 5.5 Products (list + form)
- Gallery-grade list with large thumbnails, grid/table toggle, inline publish switch.
- Form: live storefront preview side-by-side (card + PDP mini), drag-and-drop image uploader with reorder, crop guide, alt text, primary marker, completeness meter per language, slug validation, autosave indicator, sticky save bar.

### 5.6 Categories & Offers
- Categories: visual cards with cover images, drag-to-reorder, product counts.
- Offers: campaign-style editor with hero image, live preview, validity timeline, included products picker, scheduled publish.

### 5.7 Customers & Traders (people)
- Customer 360: profile header, request history timeline, linked conversations, notes, tags.
- Trader 360: profile, activity heatmap, deals/wholesale/brokerage history, account status, reset password (show-once secret with copy animation), disable with consequence dialog.

### 5.8 Trader portal (mobile-first, highest investment)
- Home: warm greeting, "بانتظارك" stack with gentle pulse, two big task cards + a third: **"اطلب وساطة"**, available offers carousel, recent activity, personal stats (my deals, accepted rate) as small elegant charts.
- Deal wizard: full-screen steps, progress, autosave, review card, success celebration.
- Wholesale builder: product picker with images, sticky summary bar, review sheet.
- Notifications center: grouped, read/unread animation, filters.
- Account & security: profile, password change (G1), sessions/devices, language, theme.
- Bottom tab bar with animated active indicator.

### 5.9 Storefront showcase screens (add as mockups if not present)
Home (cinematic hero + craft story + collections + trader band), Catalog (filters, grid, quick view), Product page (immersive gallery, zoom, specs, add-to-request), Request list + request form + success (WhatsApp handoff). These sell the brand to the client; make them the most beautiful pages in the set.

### 5.10 System & new screens
404, 403, offline, session expired, maintenance, global search results, notifications center (admin), settings (admin: team, WhatsApp, brand, security), and an onboarding / first-run empty dashboard.

### 5.11 Index / showcase gallery
`index.html` becomes a presentation-grade gallery: grouped by role, large live thumbnails, hover previews, a "walkthrough" mode that plays the main flows in sequence. This is what the owner shows the client.

---

## 6. Content and data in mockups

- Use realistic, coherent Arabic and English demo data (Syrian names, real-looking oud product names, plausible dates). Same records across all screens (the request in the inbox is the one in the requests list).
- No lorem ipsum. No "Test", no "Regression Customer".
- Prices/commission values in mockups are clearly demo data, consistent across screens.

---

## 7. New feature: Brokerage (الوساطة)

**Business model (client-approved):** a trader tells RARE OUD about goods or a source they saw (a shop, a workshop, a city, a listing). RARE OUD goes there, inspects the goods, and if the trader approves, buys and ships them to the trader. RARE OUD earns a **commission of 1–2%**, set by the admin per request. Settlement is offline (no online payment).

This is a **fourth, separate domain**: `BrokerageRequest` (+ `BrokerageInspection`, `BrokerageQuote`, `BrokerageEvent`). It is not a deal, not wholesale, not a retail request.

### 7.1 Lifecycle

| # | Status | AR label | Next actor |
|---|---|---|---|
| 1 | SUBMITTED | جديد | admin |
| 2 | NEEDS_INFO | بحاجة لمعلومات | trader |
| 3 | ACCEPTED | مقبول للمعاينة | admin |
| 4 | INSPECTION_SCHEDULED | المعاينة مجدولة | admin |
| 5 | INSPECTED | تمت المعاينة | admin |
| 6 | QUOTE_SENT | العرض بانتظارك | trader |
| 7 | APPROVED | وافق التاجر | admin |
| 8 | PURCHASED | تم الشراء | admin |
| 9 | SHIPPED | قيد الشحن | none |
| 10 | DELIVERED | تم التسليم | admin |
| 11 | CLOSED | مغلق | none |
| — | DECLINED (by admin) / REJECTED (quote declined by trader) / CANCELLED | مرفوض / رفض العرض / ملغى | none |

### 7.2 Trader side
- **Request wizard "اطلب وساطة":** (1) what: description, category, quantity, photos/screenshots, optional link; (2) where: city/area, place name, optional seller contact, optional map pin; (3) expectations: optional budget range, desired timeline, notes; (4) review & submit. Shows a clear explainer: how brokerage works, commission 1–2% of the goods value, final quote before any purchase, payment agreed directly.
- **My brokerage requests:** list + status chips + "بانتظارك" highlights.
- **Detail:** journey stepper, inspection report (photo gallery, condition grade, notes, verdict), quote card (goods value as confirmed, commission rate and amount, shipping as entered, total), approve / decline with confirm dialog, shipping tracker, timeline, linked WhatsApp conversation.

### 7.3 Admin side
- **Brokerage board:** Kanban by status + table view, filters by trader/city/age, SLA age badges.
- **Detail:** request info, trader card, actions valid for the current status, schedule inspection (date, assignee, location), **inspection report builder** (upload photos, grade A–D, checklist, notes, verdict), **quote builder** (goods value, commission rate slider 1–2% with live amount, shipping cost, notes, validity), purchase & shipping entry (carrier, tracking ref), timeline, linked conversation.
- Dashboard widget + KPI + chart segment (§5.2). Inbox context panel can link to a brokerage request.

### 7.4 Deliverables for the build phase
- `docs/ui-planning/BROKERAGE-SPEC.md`: lifecycle, fields, proposed Prisma models, transitions, permissions (trader sees only own requests), dictionary keys AR/EN.
- Update the existing `brokerage-pending-decision.html` and add every screen above as mockups.

---

## 8. Quality floors (these are not creative limits)

These protect the product and the contract. Everything else is open.

- **Business truth:** no online payment anywhere; traders do not own products; RetailRequest / Deal / Wholesale / Brokerage stay separate domains; WhatsApp text never changes a business status by itself.
- **Arabic-first, RTL-perfect:** design in Arabic first; logical properties; mirrored directional icons; `<bdi>` for mixed text; no letter-spacing or italics on Arabic.
- **Accessibility:** WCAG 2.2 AA (text ≥ 4.5:1, aim 7:1 for body), visible focus, keyboard-operable everything, touch targets ≥ 44 px, landmarks, labels, live regions. axe: zero violations.
- **Responsive:** perfect at 375, 768, 1024, 1440, 1920. No horizontal overflow (watch CSS Grid: use `minmax(0, …)`).
- **Performance:** each mockup page interactive fast on mid-range mobile; heavy effects (WebGL, blur) degrade on low-end / Save-Data / reduced motion; pause animations off-screen.
- **Zero emoji** in UI and in reports.
- **Every string** in AR and EN.

---

## 9. Self-review loop (mandatory, per screen)

For each screen: build → capture screenshots (375 / 1440, AR and EN, plus one interaction state) → critique with `design-critique` → fix → repeat. **Minimum two full critique passes.** A screen is done only when every answer below is "yes":

1. Would this screenshot stop a senior designer scrolling on Dribbble/Awwwards?
2. Is there a clear focal point and a single primary action?
3. Does it have depth (layers, light, texture) — no flat gray boxes, no bare default controls?
4. Is the brand unmistakable (rings / grain / waveform / light / typography) without being decorative noise?
5. Does every interactive element have hover, focus, active, disabled, and loading states?
6. Are loading, empty, error, and success states designed — with personality?
7. Does motion explain something and feel premium (damped, smooth, never bouncy or laggy)?
8. Is there anything a user of Linear/Stripe/Apple would expect here that is missing (search, shortcuts, bulk actions, preview, undo, filters)? If yes, add it.
9. Is the Arabic typography beautiful (size, line-height, weight), not just correct?
10. Perfect at 375 px with no overflow and comfortable thumb reach?
11. axe zero violations, keyboard path complete, reduced motion verified live?
12. Is it richer and more complete than the old screen in every way while keeping what worked?

Record each screen's two critique passes briefly in `docs/ui-planning/REVIEW-LOG.md` (what you changed and why).

---

## 10. Execution waves

| Wave | Scope | Stop? |
|---|---|---|
| 0 | Design system v3 (`tokens.css`, `components.css`, `motion.js`), brand glyphs, chart theme, WebGL/SVG brand scene, `STACK.md`, `SCREENS.md` inventory | No |
| 1 | **Signature screens:** Login, Admin dashboard, Trader home, Storefront home | **Yes — one checkpoint.** Present the direction with screenshots and a short screen recording/GIF. This locks the visual direction before scaling it to 25+ screens |
| 2 | Operations: Inbox, Requests, Deals, Wholesale, **Brokerage (all screens)** + `BROKERAGE-SPEC.md` | No |
| 3 | Catalog: Products, Categories, Offers + storefront Catalog, PDP, Request flow | No |
| 4 | People & system: Customers, Traders, Notifications, Account/Security, Settings, 404/403/offline/session, onboarding | No |
| 5 | Showcase `index.html` + walkthrough mode + final full-sweep QA | **Yes — final delivery** |

Commit per screen with clear messages. Never `reset --hard`. Do not touch Project A. Mockups only in this phase — no changes to the Next.js app code.

---

## 11. Final delivery report (end of Wave 5)

Short and factual, no emoji, no self-praise:
- Screens delivered (old → upgraded, plus new ones) with links.
- Features added beyond the old screens, grouped by area.
- Brokerage: screens + spec file.
- Libraries used (`STACK.md`).
- Test results: axe per page, overflow check per breakpoint, reduced-motion live verification, keyboard pass.
- Known limitations, stated honestly — with what you tried before accepting each one.
