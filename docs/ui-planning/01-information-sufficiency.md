# UI Planning — Stage C: Information Sufficiency Gate

**Project:** rare-oud-platform (Project B)  
**Baseline git commit:** `72a56a7` — *Initial baseline: RARE OUD platform before UI planning edits.*  
**Intake date:** 2026-10-10  
**Contractual scope source (declared):** `cost-breakdown-scope.md` + contract — **not** `docs/client-progress-report.md` alone.

---

## 1. Recorded intake answers (Stage B)

| # | Topic | Your answer | Status |
|---|--------|-------------|--------|
| 1 | Screenshots minimum set | Yes — S1–S4, S8, S11, S14 within **48h**; rest later | **Pending delivery** |
| 2 | Capture environment | `localhost:3000`, seed data | Accepted |
| 3 | Reduced-motion captures | No | Accepted |
| 4 | Palette | `#F4E7D8` cream approved (matches identity study); `#0B080D`, `#32104F` approved; **correct Week 1 doc not code** | Doc updated in `docs/week-1/04-brand-aligned-visual-design.md`; SVG logo **not available** |
| 5 | Logo rules | Default + **no stretch / no off-palette coloring** | Accepted |
| 6 | Font licensing | Open source / commercial OK (Google Fonts path) | Accepted |
| 7 | Photography | Real product photos TBD; **temporary:** current `public/brand/editorial/*` | **Gap:** real SKU photography plan |
| 8 | Never-do | No cartoon icons, no generic stock instruments, no fake inventory, no e-payment language, no countdown | Accepted |
| 9 | References | Assigned to planning team — **proposals in §2 below** | **Pending your confirm / “default”** |
| 10 | Motion | Signature on **storefront Hero only**; subtle elsewhere; respect reduced-motion | Accepted |
| 11 | Theme | Light cream only v1 | Accepted |
| 12 | Audience mix | **Do not** plan around 85/10/5 — **traders are highest stakeholder priority** despite low count | **Gap:** numeric traffic split optional; **priority rule recorded** |
| 13 | Devices / regions | Assume **weak/intermittent networks**, **mobile majority** | Accepted (details in §2) |
| 14 | i18n | **Arabic-first for all three roles** (storefront + admin + trader); EN secondary | Accepted — **scope expansion** vs as-built (admin/trader mostly EN today) |
| 15 | Tone | Short refined Arabic + formal English | Accepted |
| 16 | Launch catalog counts | Client/TENEGTA to supply | **Gap** |
| 17 | Media readiness % | Client/TENEGTA to supply | **Gap** |
| 18 | Small catalog | Elegant empty states, no fake stock | Accepted |
| 19 | P0 screens | Home, catalog, PDP (**with images**), cart, request, admin (requests/products/inbox), trader (deals/wholesale) | Accepted |
| 20 | WhatsApp inbox ops | TBD; **must be mobile-responsive** | **Gap** |
| 21 | Promised visuals | Wireframes **1.3 + 1.4** only; ref file `cost-breakdown-scope.md` | **File missing in repo — BLOCKER** |
| 22 | Fix order | Catalog + PDP images **before** further polish | Accepted |
| 23 | Libraries | Current stack + **one icon set**; no heavy UI libs, **no charts**; motion CSS until explicit decision | Accepted |
| 24 | Performance | LCP &lt; 2.5s slow 4G, **next/image**, last 2 browser versions | Accepted — **implementation gap** vs as-built (no next/image) |
| 25 | A11y | WCAG 2.2 **AA storefront**; labels/focus/contrast baseline admin/trader | Accepted |
| 26 | SEO / legal | Metadata, OG, sitemap, robots, Product structured data; privacy + contact; **no** cookie banner; analytics later | Accepted |
| 27 | Approvals | **TENEGTA manager** + **weekly client review** | Accepted |
| 28 | Plan format | Markdown in `docs/ui-planning/` + token tables; Figma optional later | Accepted |
| 29 | Time budget | TBD | **Gap** |
| 30 | Review method | **Screen-by-screen** all surfaces | Accepted |
| 31 | Contract doc | `cost-breakdown-scope.md` + contract | **File not found in repository** |
| 32 | Pain points (3) | After screenshot review | **Deferred** |
| 33 | Rejected directions | Assigned to planning team | **Proposals in §2** |
| 34 | Git | **Required** — init + baseline before edits | **Done:** `72a56a7` |
| 35 | Trader/admin Arabic | **In scope** — full localization | Accepted — **major UI plan requirement** |

---

## 2. Proposed defaults (need explicit accept or edits)

### 2.1 Reference sites (Q9) — borrow / avoid

| # | Reference | Borrow | Avoid |
|---|-----------|--------|-------|
| R1 | [Aesop](https://www.aesop.com/) | Editorial pacing, generous whitespace, product-as-story, bilingual calm | Perfume-brand purple clichés, promotional banners |
| R2 | [Patek Philippe](https://www.patek.com/) | Extreme restraint, no urgency language, trust through typography | Watch/jewelry metaphor copy, dark luxury tropes as default theme |
| R3 | [Teenage Engineering](https://teenage.engineering/) | Product protagonist layout, minimal chrome, confident negative space | Consumer-gadget playfulness, loud color accents |
| R4 | [Molteni&C](https://www.molteni.it/en) | Material/craft photography grids, category navigation clarity | Full furniture-scale layouts on mobile |
| R5 | Apple product pages (e.g. [iPhone gallery pattern](https://www.apple.com/iphone/)) | Scroll chapter structure, spec hierarchy — **structure only** | Glassmorphism, system fonts, generic “tech” aesthetic |

**Action:** Reply **“default”** on Q9 to lock these, or replace any row with your links.

### 2.2 Audience & devices (Q12–Q13)

| Dimension | Proposed planning assumption |
|-----------|------------------------------|
| **UX priority (not headcount)** | **Trader portal = highest design/craft investment** per client; admin inbox second for mobile ops; retail storefront = broadest reach |
| Traffic (illustrative, non-binding) | Retail visits ≫ admin ≫ trader logins — **do not under-invest trader UI because of low login count** |
| Geography | MENA + Gulf + Arabic diaspora (EU/US) — shipping copy already international |
| Network | Design for **slow 4G + offline-tolerant forms** (clear save states, no heavy autoplay video) |
| Mobile share | Plan **~75%+ mobile** for retail; **admin inbox usable on phone** (375px+) |

**Action:** Confirm or adjust one sentence for Q12 numeric expectations (optional).

### 2.3 Rejected / already-decided directions (Q33)

| Direction | Status |
|-----------|--------|
| Logo-as-hero dominant composition | **Rejected** — Hero V3 is oud-led |
| Flash sale / countdown / fake scarcity | **Rejected** (Q8) |
| Generic multi-vendor marketplace chrome | **Rejected** (project boundary) |
| Payment/checkout UI | **Out of scope** |
| Dark mode v1 | **Rejected** (Q11) |
| Heavy chart-based admin reporting | **Out of scope** (Q23) |

---

## 3. Dimension scores

| # | Dimension | Score | What is missing or at risk |
|---|-----------|-------|----------------------------|
| 1 | Product scope | **GAPS** | `cost-breakdown-scope.md` **not in repo** — cannot line-map deliverables to UI |
| 2 | Brand & identity | **GAPS** | SVG logo unavailable; real product photography plan (Q7, Q17) |
| 3 | Audience & devices | **COMPLETE*** | *Priority rule + network/mobile assumptions recorded; optional numeric split |
| 4 | Content readiness | **GAPS** | Launch counts (Q16), media readiness % (Q17) |
| 5 | Existing UI (as-built) | **COMPLETE** | `00-as-built-report.md` |
| 6 | Visual evidence (screenshots) | **GAPS** | Minimum set **committed 48h — not yet received** |
| 7 | Constraints | **COMPLETE** | Performance, a11y, SEO, libraries documented |
| 8 | References | **GAPS** | §2.1 proposals **await your “default” or edits** |
| 9 | Priorities | **COMPLETE** | P0 list + trader-first UX priority |
| 10 | Process & approvals | **GAPS** | Time budget (Q29); pain points after screenshots (Q32) |

---

## 4. UNVERIFIED items from Stage A — disposition

| Item | Disposition |
|------|-------------|
| Git snapshot | **Verified** — `72a56a7` on `master` |
| Cost Breakdown line mapping | **Open BLOCKER** until `cost-breakdown-scope.md` added |
| Visual spacing/feel | **Open** until minimum screenshots arrive |
| Catalog/PDP missing images | **Accepted launch risk** if not fixed before go-live — **explicit P0 fix** (Q22) |
| Contrast / WCAG AA | **Open** until screenshots + token audit in UI plan phase |
| Ivory doc vs code | **Resolved** — doc aligned to `#F4E7D8` |

---

## 5. Overall verdict

## **NOT READY**

**Reason:** One or more **BLOCKERs** remain unresolved:

1. **`cost-breakdown-scope.md` missing** from the repository (Q31) — cannot certify contractual UI scope.
2. **Minimum screenshots** (S1–S4, S8, S11, S14) **not yet delivered** (Q1 — 48h window in progress).
3. **Launch content** (Q16–Q17) not specified.
4. **WhatsApp operational profile** (Q20) not specified.
5. **Planning time budget** (Q29) not specified.
6. **Reference set** (Q9) not explicitly accepted.

**NOT blocking but required before implementation sign-off:** Q32 pain points after screenshots; SVG logo; full i18n for admin/trader (scoped in plan, not in as-built).

---

## 6. Git note

Repository initialized at `D:\N I G H T\rare-oud-platform`. Baseline commit **`72a56a7`**. Subsequent commits should include only planning/docs changes until **GO UI PLAN** implementation phase.

Local backup: copy project folder or push to remote when configured (not done in this step).

---

## 7. Doc alignment performed post-baseline

Per answer **#4**, warm cream in Week 1 brand doc updated to `#F4E7D8` and surface tone to `#EFE3D4` — see `docs/week-1/04-brand-aligned-visual-design.md` (not yet committed separately from this file).
