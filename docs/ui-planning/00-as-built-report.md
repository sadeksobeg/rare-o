# UI Planning — Stage A: As-Built Report (Project B: rare-oud-platform)

**Scope:** `D:\N I G H T\rare-oud-platform` only. Read-only audit; evidence from opened files and repository search (excluding `node_modules` unless noted).

**Status vocabulary:** IMPLEMENTED / PARTIAL / PLACEHOLDER / MISSING / UNVERIFIED / OUT OF SCOPE

---

## A0. Snapshot

| Item | Status | Evidence |
|------|--------|----------|
| Git branch | UNVERIFIED | `git status` → `fatal: not a git repository` (no `.git` under project root) |
| Last commit hash / date | UNVERIFIED | Same as above |
| Working tree | UNVERIFIED | No git metadata |
| Package manager | IMPLEMENTED | `package-lock.json` present; `package.json` scripts use `npm` |
| Node version (audit machine) | IMPLEMENTED | `node -v` → v22.14.0; `npm -v` → 10.9.2 |
| Week 1 (Planning & Design) | IMPLEMENTED (docs) | `docs/week-1/*` (IA, wireframes, brand doc); **no Week 1 application code** |
| Week 2 (Core platform) | IMPLEMENTED | Storefront, admin auth, catalog, retail request path — routes under `app/(storefront)/`, `app/admin/` |
| Week 3 (Deals / Wholesale / Retail handoff) | IMPLEMENTED | `prisma/schema.prisma` domain models; `app/trader/`, deal/wholesale actions; `docs/week-3/*` |
| Week 4 (WhatsApp Stage A) | IMPLEMENTED | Baileys worker scripts, inbox UI, `WhatsApp*` models — `docs/week-4/*`, `app/admin/(protected)/inbox/` |
| Cost Breakdown document | MISSING | No file matching `*cost*` in repository (see A12) |

---

## A1. Stack and UI dependencies

| Layer | Choice | Version / notes | Evidence |
|-------|--------|-----------------|----------|
| Framework | Next.js (App Router) | 15.3.3 | `package.json` L29 |
| React | React 19 | ^19.0.0 | `package.json` L30–31 |
| Language | TypeScript | ^5 | `package.json` devDependencies |
| Router | App Router | Route groups `(storefront)`, `admin/(protected)`, `trader/(protected)` | `app/` tree (45 route files) |
| Styling | Tailwind CSS 4 + `@import "tailwindcss"` | ^4 | `package.json` L45; `app/globals.css` L1 |
| Component library | None (custom) | — | No Radix/MUI/shadcn in `package.json` |
| Icons | Inline / text | No Lucide/Heroicons dep | `package.json` dependencies |
| Fonts | `next/font/google` | Noto Sans Arabic, Source Sans 3, Cormorant Garamond, Noto Naskh Arabic | `app/layout.tsx` L12–36, L55 |
| Animation | CSS + small client helper | `--ro-dur-*`, `.ro-hero-v3`, `Reveal` | `app/globals.css`; `components/storefront/motion/reveal.tsx` |
| Forms / validation | Server actions + Zod | zod ^3.24 | `package.json` L33; actions in `app/actions.ts`, etc. |
| i18n | Cookie locale + dictionaries | `ar` default, RTL | `lib/i18n/config.ts`, `lib/i18n/dictionaries.ts`, `lib/i18n/server.ts` |
| State (client) | React Context | Cart, discovery | `components/storefront/cart-provider.tsx`, `discovery-context.tsx` |
| Charts | MISSING | — | No chart library in deps |
| Image optimization | MISSING in UI | No `next/image` in app/components | Grep `next/image` — only `next-env.d.ts` / node_modules |
| DB (UI data) | Prisma + SQLite | 6.19.3 | `prisma/schema.prisma` |
| WhatsApp UI backend | Baileys adapter | @whiskeysockets/baileys 6.7.24 | `package.json` L25; worker `worker/whatsapp-worker.ts` (not UI) |

**Unused / duplicate UI-relevant notes**

| Finding | Status | Evidence |
|---------|--------|----------|
| Legacy Next starter SVGs in `public/` | PLACEHOLDER | `public/next.svg`, `globe.svg`, etc. — not referenced in storefront grep (UNVERIFIED for all usages) |
| Dead homepage modules | PARTIAL / debt | `HomeDiscovery`, `HomeCategories`, `HomeFeaturedProducts` not imported by `app/(storefront)/page.tsx` — only self-references (`components/storefront/home/discovery.tsx`, etc.) |
| `ProductCard` | PARTIAL | Used only from dead home modules; homepage uses `mosaic-tile`, `discovery-rail` (`grep ProductCard`) |
| `clsx` + `tailwind-merge` | IMPLEMENTED | `lib/utils.ts` pattern via `RoButton` (`components/ui/ro-button.tsx`) |

---

## A2. Route map

**Global:** No project-level `loading.tsx`, `error.tsx`, or `not-found.tsx` under `app/` (glob search). Product detail calls `notFound()` from `next/navigation` when missing slug.

**Auth:** `middleware.ts` JWT cookies `ro_admin_session` / `ro_trader_session`; role checks `admin` vs `trader` (L12–49).

| Path | File | RSC / Client | Auth | Role | Domain / entities | loading/error/not-found | i18n | RTL |
|------|------|--------------|------|------|-------------------|---------------------------|------|-----|
| `/` | `app/(storefront)/page.tsx` | Server | Public | Visitor | Product, Category, PublicCuratedOffer (read) | MISSING route-level | dict via `getRequestDictionary` | `html dir` from locale |
| `/catalog` | `app/(storefront)/catalog/page.tsx` | Server | Public | Visitor | Product, Category | MISSING | dict + inline search placeholder AR/EN L28–29 | Yes |
| `/product/[slug]` | `app/(storefront)/product/[slug]/page.tsx` | Server | Public | Visitor | Product | `notFound()` only | dict | Yes |
| `/cart` | `app/(storefront)/cart/page.tsx` | Server | Public | Visitor | — (client cart) | MISSING | dict labels to `CartView` | Yes |
| `/request` | `app/(storefront)/request/page.tsx` | Server + `RequestForm` client | Public | Visitor | RetailRequest create | MISSING | dict | Yes |
| `/offers` | `app/(storefront)/offers/page.tsx` | Server | Public | Visitor | PublicCuratedOffer | MISSING | dict | Yes |
| `/offers/[slug]` | `app/(storefront)/offers/[slug]/page.tsx` | Server | Public | Visitor | PublicCuratedOffer | UNVERIFIED detail | dict | Yes |
| `/admin/login` | `app/admin/login/page.tsx` | Client | Public | — | AdminUser login | MISSING | Hard-coded EN | LTR typical |
| `/admin` | `app/admin/(protected)/page.tsx` | Server | Cookie JWT | admin | Aggregates RetailRequest, Product counts | MISSING | Mixed EN dashboard copy | Partial (locale toggle in shell) |
| `/admin/products`, `/new`, `/[id]` | `app/admin/(protected)/products/*` | Server + client forms | admin | Product, ProductImage | MISSING | Partial dict | Partial |
| `/admin/categories` | `app/admin/(protected)/categories/page.tsx` | Server | admin | Category | MISSING | Partial | Partial |
| `/admin/customers` | `app/admin/(protected)/customers/page.tsx` | Server | admin | Customer (CRM) | MISSING | Partial | Partial |
| `/admin/requests`, `/[id]` | `app/admin/(protected)/requests/*` | Server | admin | RetailRequest, handoff | MISSING | Partial | Partial |
| `/admin/traders` | `app/admin/(protected)/traders/page.tsx` | Server | admin | TraderAccount | MISSING | EN labels in shell | Partial |
| `/admin/deals`, `/[id]` | `app/admin/(protected)/deals/*` | Server | admin | DealProposal, NegotiationEntry | MISSING | EN nav | Partial |
| `/admin/wholesale`, `/[id]` | `app/admin/(protected)/wholesale/*` | Server | admin | WholesaleRequest | MISSING | EN nav | Partial |
| `/admin/offers`, `/new`, `/[id]` | `app/admin/(protected)/offers/*` | Server | admin | PublicCuratedOffer | MISSING | EN nav | Partial |
| `/admin/inbox`, `/[id]` | `app/admin/(protected)/inbox/*` | Server + client pieces | admin | WhatsAppConversation, Message | MISSING | `dict.inbox.*` | Partial |
| `/trader/login` | `app/trader/login/page.tsx` | Client | Public | — | TraderAccount login | MISSING | Hard-coded EN | LTR |
| `/trader` | `app/trader/(protected)/page.tsx` | Server | Cookie JWT | trader | DealProposal list | MISSING | Hard-coded EN | UNVERIFIED |
| `/trader/deals`, `/new`, `/[id]` | `app/trader/(protected)/deals/*` | Server + forms | trader | DealProposal, NegotiationEntry | MISSING | EN | UNVERIFIED |
| `/trader/wholesale`, `/requests`, `/[id]` | `app/trader/(protected)/wholesale/*` | Server + forms | trader | WholesaleRequest | MISSING | EN | UNVERIFIED |
| `/trader/offers` | `app/trader/(protected)/offers/page.tsx` | Server | trader | PublicCuratedOffer (read) | MISSING | EN | UNVERIFIED |
| `/trader/profile` | `app/trader/(protected)/profile/page.tsx` | Server | trader | TraderAccount | MISSING | EN | UNVERIFIED |

**Server actions (UI-triggered, not routes):** `app/actions.ts`, `deal-actions.ts`, `wholesale-actions.ts`, `whatsapp-actions.ts`.

---

## A3. Screen inventory and states

| Screen | Purpose | Main components | States (evidence) | Responsive | Content source |
|--------|---------|-----------------|-------------------|------------|----------------|
| Home | Discovery + brand story | `HomeHero`, discovery rails, `HomepageShell` | Empty rails when no products/offers (`page.tsx` L69–80); loading MISSING | `sm`/`md`/`lg` in hero, discovery (grep breakpoints) | DB via `getHomepageDiscoveryData` + editorial JPGs |
| Catalog | List/filter products | Inline page markup | Empty: `dict.catalog.empty` L57–58; images PLACEHOLDER div L66 | `sm:grid-cols-2 lg:grid-cols-3` | Published products |
| Product | PDP | `AddToCartButton` | unavailable branch; image area PLACEHOLDER L30 | `md:grid-cols-2` | Product row; **no ProductImage render** |
| Cart | Line items | `CartView` (client) | empty from dict | UNVERIFIED | localStorage cart |
| Request | Retail handoff | `RequestForm` | empty cart message hard-coded EN L54; success + WhatsApp | UNVERIFIED | Creates RetailRequest |
| Offers list/detail | Curated offers | UNVERIFIED detail file depth | empty if none | UNVERIFIED | DB |
| Admin dashboard | Counts + links | Inline | Always shows cards | `sm`/`lg` grid L21 | `getDashboardCounts` |
| Admin inbox | WhatsApp list/thread | `InboxHealthBanner`, composer | empty `dict.inbox.empty` L37–39 | wrap nav | DB persistence |
| Trader home | Hub | Inline links | deals.length in label | flex-wrap | Trader deals |
| Logins | Auth | Client forms | validation error from action | centered column | seed/admin-created users |

**Homepage section stack (IMPLEMENTED):** Hero → shortcuts → brand intro → categories → featured instrument → mosaic → offers/products rails → attribute explorer → oud editorial → principles → final CTA → footer (`app/(storefront)/page.tsx` L37–117).

---

## A4. Component inventory

| Folder | Role | Variants / props | Duplicates / notes |
|--------|------|------------------|-------------------|
| `components/storefront/home/` | Marketing sections | Hero V3 client; several server sections | **Dead:** `discovery.tsx`, `categories.tsx`, `featured-products.tsx` vs live discovery stack |
| `components/storefront/discovery/` | Homepage commerce UX | Compare, search overlay, quick view, mosaic | Rich client interactivity |
| `components/storefront/` shared | Chrome, cart, request | `header`, `footer`, `brand-mark`, `section-heading` | `media-plane` / `material-field` used by dead home modules |
| `components/ui/` | `RoButton`, `RoButtonLink` | variants: primary, secondary, ghost, on-dark | Admin/trader often use raw `<button>` styles |
| `components/admin/` | CRUD + inbox | Forms, `shell`, inbox widgets | Shell mixes dict + hard-coded EN link labels L21–24 |
| `components/trader/` | Wholesale + deals UI | Forms, `shell` | **All nav EN hard-coded** (`trader/shell.tsx` L10–17) |
| `components/deals/` | `negotiation-form` | — | Shared admin/trader negotiation |

**Hard-coded strings (samples):** Admin shell "Traders", "Deals" (`components/admin/shell.tsx` L21–24); trader shell all labels L10–17; admin login "Email"/"Password" (`app/admin/login/page.tsx` L16–25); request form "Cart is empty." (`components/storefront/request-form.tsx` L54); catalog search placeholder inline (`catalog/page.tsx` L28–29).

**Hard-coded colors bypassing tokens:** `hero.tsx` gradient `from-[#F4E7D8]` (grep `#` in components — 1 file); additional hex in `app/globals.css` gradients L68–80.

---

## A5. Design system as built

| Token / topic | Location | Values / behavior | Evidence |
|---------------|----------|-------------------|----------|
| CSS variables | `app/globals.css` `:root` L3–21 | `--ro-near-black: #0b080d`, `--ro-deep-purple: #32104f`, cream/ivory `#f4e7d8`, surfaces, motion durations | L3–21 |
| Tailwind theme | `@theme inline` L23–38 | Maps to `bg-ro-purple`, `text-ro-cream`, etc. | L23–38 |
| Typography | `--font-sans`, `--font-display` | Arabic + Latin stacks via Next font variables | `app/layout.tsx`, `globals.css` L37–38 |
| Spacing / radii | Tailwind defaults | No custom spacing scale file; arbitrary `text-[…]` common on storefront | grep `text-[` → **~75 matches across 20 component files** (storefront-heavy) |
| Shadows / elevation | Minimal | Mostly borders `border-ro-line`, hairline utilities | `.ro-hairline` L83–88 |
| Motion | `--ro-dur-enter` 900ms, hero keyframes | `prefers-reduced-motion` blocks hero motion | `globals.css` L271–358 |
| z-index | Ad hoc in discovery overlays | UNVERIFIED full map | search/compare components |
| Dark mode | MISSING | Single light cream background | `:root` only |
| Doc vs code ivory | **Inconsistency** | Week 1 doc `#F2EEF4`; code `#f4e7d8` | `docs/week-1/04-brand-aligned-visual-design.md` L25 vs `globals.css` L6–7 |

**Grep counts (components + app TSX/CSS, excluding node_modules)**

| Pattern | Count | Notes |
|---------|-------|-------|
| `#hex` in `components/**/*.tsx` | 1 file (hero) | 1 match |
| `#hex` in `app/globals.css` | 14 lines with hex | Gradients + `:root` |
| `text-[` arbitrary font sizes | ~75 | Storefront marketing/discovery |
| `p-[` / `px-[` arbitrary spacing | 0 | — |
| Physical `ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-` | 2 matches | `hero.tsx` only |
| Logical `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-` | ~15 matches | 9 files — **partial** RTL migration |

**Case study palette (Resonant Core / near-black / purple / cream):** **PARTIAL match** — near-black and purple match docs; cream implemented as `#f4e7d8` not doc `#F2EEF4`. Emblem: PNG marks in `public/brand/mark-*.png`, not SVG vector in repo.

---

## A6. Brand and assets

| Asset | Status | Path | Evidence |
|-------|--------|------|----------|
| Master mark | IMPLEMENTED | `public/brand/mark-master.png` | dir listing |
| Small mark | IMPLEMENTED | `public/brand/mark-small.png` | dir listing |
| Editorial photography | IMPLEMENTED | `public/brand/editorial/*.jpg` (4 files) | dir listing; `lib/brand/editorial.ts` UNVERIFIED in this pass |
| Atmosphere SVGs | IMPLEMENTED | `public/brand/atmosphere-*.svg` | dir listing |
| Favicon | IMPLEMENTED | `app/favicon.ico` | `app/` dir |
| App icon | IMPLEMENTED | `app/icon.png` | `app/` dir |
| Product uploads dir | PLACEHOLDER | `public/uploads/.gitkeep` only | dir listing |
| Vector logo | MISSING | No `.svg` logo | — |
| Font licensing | UNVERIFIED | Google Fonts via Next | `app/layout.tsx` — license text not in repo |
| Stock Next assets | PLACEHOLDER | `public/next.svg`, etc. | Likely template residue |

---

## A7. Domain-to-UI mapping

| Entity | Lifecycle states (schema) | UI surfaces | Role | Gaps |
|--------|---------------------------|-------------|------|------|
| Product | draft/published/archived; available/unavailable | Admin products; storefront catalog/PDP/home discovery | admin, visitor | **ProductImage not shown on catalog/PDP** — PARTIAL |
| Category | — | Admin categories; catalog filter; homepage | admin, visitor | IMPLEMENTED |
| RetailRequest | draft → … → cancelled | `/request`, admin requests | visitor, admin | Visitor status tracking UI MISSING post-submit beyond success |
| RetailHandoffEvent | event types | Admin request detail (UNVERIFIED depth) | admin | — |
| Customer | CRM record | Admin customers | admin | Not visitor accounts — by design |
| TraderAccount | active/disabled | Admin traders; trader login/profile | admin, trader | No self-registration UI — IMPLEMENTED boundary |
| DealProposal | proposed → closed | Trader + admin deals pages | trader, admin | — |
| NegotiationEntry | actions | Negotiation forms | trader, admin | — |
| PublicCuratedOffer | draft/published/unpublished | Admin offers; `/offers`; trader read | admin, visitor, trader | — |
| WholesaleRequest | submitted → cancelled | Trader wholesale + admin wholesale | trader, admin | — |
| WhatsAppConversation/Message | link types; message status | Admin inbox | admin | No broadcast/bulk UI — OUT OF SCOPE per boundary |
| Generic Order | — | **MISSING** | — | Correct per boundary |

---

## A8. Roles and access in the UI

| Role | Navigation | Guard | Session end |
|------|------------|-------|-------------|
| Visitor | Storefront header/footer; cart | None on storefront | N/A |
| Admin | `AdminShell` nav | `middleware.ts` + `AdminShell` redirect | `adminLogoutAction` in shell form |
| Trader | `TraderShell` nav | `middleware.ts` + `TraderShell` redirect | `traderLogoutAction` |

**Unauthorized:** Redirect to respective login — no dedicated 403 page (`middleware.ts` L15–48).

**Visitor cannot access** `/admin/*` or `/trader/*` without JWT — IMPLEMENTED.

---

## A9. i18n and RTL

| Topic | Status | Evidence |
|-------|--------|----------|
| Locales | IMPLEMENTED | `ar`, `en`; default `ar` — `lib/i18n/config.ts` L1–3 |
| Direction | IMPLEMENTED | `dirForLocale`, root `html dir` — `app/layout.tsx` L48–54 |
| Storefront copy | IMPLEMENTED | Large `lib/i18n/dictionaries.ts` |
| Admin copy | PARTIAL | Dashboard/inbox use dict; nav links EN hard-coded in shell |
| Trader UI | MISSING i18n | `TraderShell` + trader pages English |
| Missing key audit | UNVERIFIED | No automated key coverage count run |
| Hard-coded strings | PARTIAL | See A4; request empty cart EN |
| Physical vs logical CSS | PARTIAL | Mostly logical on new hero; legacy `left`/`right` minimal |
| Number/currency format | PARTIAL | `toLocaleString(locale)` on prices — `product/[slug]/page.tsx` L34 |
| Arabic typography | PARTIAL | Noto families loaded; display scale uses many arbitrary `text-[` sizes |

---

## A10. Accessibility as built

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Landmarks | PARTIAL | `<main>` in storefront/admin/trader layouts; header/footer present |
| Heading hierarchy | UNVERIFIED per page | Homepage multi-`h2` pattern in sections — not fully audited |
| Form labels | PARTIAL | Admin login uses `<label>` L15–32; many admin forms UNVERIFIED |
| Focus visible | PARTIAL | `RoButton` / `RoButtonLink` `focus-visible:outline-*` L8–16 `ro-button.tsx`; raw buttons often lack |
| Keyboard | PARTIAL | Discovery overlays use some `aria-*` (grep **~29** aria/role hits in components, concentrated in header/search/compare/hero) |
| ARIA | PARTIAL | Hero `aria-*` (7 in hero.tsx per grep count) |
| Contrast (computed) | UNVERIFIED | Requires runtime/screenshots |
| Reduced motion | IMPLEMENTED | `globals.css` `@media (prefers-reduced-motion: reduce)`; `Reveal` `is-reduced` |
| Form errors | PARTIAL | Login shows error text; not `aria-live` UNVERIFIED |

---

## A11. Performance-relevant UI facts

| Topic | Status | Evidence |
|-------|--------|----------|
| RSC vs client | Storefront pages mostly Server Components; **31** client component files under `components/` (`"use client"`) | grep |
| Images | Native `<img>` in discovery/home; **no** `next/image` in application source | grep |
| Fonts | `display: "swap"` on all Next fonts | `app/layout.tsx` L15–35 |
| Client bundles | Discovery + hero client sections likely largest storefront JS | component graph |
| LCP risk | Large editorial JPGs + unoptimized `<img>` | UNVERIFIED without Lighthouse |
| Layout shift | Hero animations transform/opacity | `globals.css` hero block |

---

## A12. Scope coverage versus Cost Breakdown

**Cost Breakdown document:** **MISSING from repository.** Per audit rules, items below are mapped to **`docs/client-progress-report.md`** section headings (L30–70) and code evidence only — **not** to a formal Cost Breakdown line-item list.

| Cost Breakdown section (from client report) | UI / code mapping | Status | Evidence |
|---------------------------------------------|-------------------|--------|----------|
| Planning & Design | Week 1 docs only | DOCS ONLY | `docs/week-1/*` |
| Core Storefront | Home, catalog, PDP, cart, request, offers | PARTIAL | Routes exist; PDP/catalog images PLACEHOLDER |
| Trader Deals & Requests | Trader + admin deals, negotiation | IMPLEMENTED | `app/trader/deals/*`, `app/admin/deals/*` |
| Orders & WhatsApp Handoff | Retail request + wa.me handoff UI | IMPLEMENTED (no payment) | `RequestForm`, dictionaries payment disclaimer |
| Admin & Reporting | Admin modules, dashboard counts | PARTIAL | No formal reporting charts |
| Security & Launch | Auth middleware, scripts | PARTIAL UI | Login shells minimal styling |
| Wholesale Trader Ordering | Trader/admin wholesale | IMPLEMENTED | wholesale routes + forms |
| WhatsApp Business Integration | Inbox, health, link controls | IMPLEMENTED (Stage A) | `app/admin/inbox/*`, Baileys worker |

**Action:** Provide Cost Breakdown document or confirm client report is the contractual scope source (Stage B question).

---

## A13. UI debt and risks

| ID | Priority | Finding | Evidence |
|----|----------|---------|----------|
| R1 | P0 | **Catalog and PDP do not render product photos** despite `ProductImage` model and homepage using images | `catalog/page.tsx` L66; `product/[slug]/page.tsx` L30 vs `featured-instrument.tsx` L53 |
| R2 | P0 | **Cost Breakdown not in repo** — cannot certify scope-to-UI mapping for client review | A12 |
| R3 | P1 | **Brand ivory doc (#F2EEF4) vs implementation (#f4e7d8)** | week-1 doc vs `globals.css` |
| R4 | P1 | **Trader portal entirely English** while product is Arabic-first retail | `trader/shell.tsx` |
| R5 | P1 | **Dead UI modules** increase planning confusion | unused home components |
| R6 | P1 | **No route-level loading/error/not-found** UX | missing `loading.tsx` / `error.tsx` |
| R7 | P2 | **No next/image** — performance and CLS risk | grep |
| R8 | P2 | **Admin shell partial i18n** | `admin/shell.tsx` L21–24 |
| R9 | P2 | **Hard-coded EN** in request empty cart | `request-form.tsx` L54 |
| R10 | P2 | **Template SVG assets** in public | `public/next.svg` etc. |

**Business boundary check (sample):**

| Rule | Status | Evidence |
|------|--------|----------|
| No payment gateway / payment UI | IMPLEMENTED | Only copy in `dictionaries.ts` (grep payment in app — dict only) |
| No trader storefront / inventory ownership | IMPLEMENTED | Trader pages are deals/wholesale only |
| No customer self-registration | IMPLEMENTED | No register route |
| Separate domains, no generic Order | IMPLEMENTED | `prisma/schema.prisma` models |
| WhatsApp = Baileys, no marketing/bulk UI | IMPLEMENTED | Inbox + text composer; no broadcast UI in app grep |

---

## A14. Not determinable from code (feeds Stage B)

- Actual visual composition, spacing rhythm, and “premium/cinematic” feel on real devices
- Computed color contrast and Arabic rendering quality in browsers
- Lighthouse / Web Vitals scores
- Production WhatsApp QR / connected state appearance
- Real catalog size and content quality at launch
- Client-approved logo vectors, misuse rules, final palette sign-off
- Cost Breakdown document and any mockups promised to client
- Git history and deployment environment
- Which admin/trader workflows operators use daily (device, volume)

---

## Report metadata

- **Generated:** Stage A read-only audit (UI planning intake)
- **Project path:** `D:\N I G H T\rare-oud-platform`
- **Git verification of write scope:** UNVERIFIED (not a git repository)
