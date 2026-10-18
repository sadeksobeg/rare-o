# Professional Readiness AUDIT — Project B (Rare Oud)

**Date:** 2026-10-18  
**Mode:** STEP 1 — read + limited run only  
**Contract SoT:** [`docs/scope/cost-breakdown-scope.md`](../scope/cost-breakdown-scope.md) (= Appendix S in `PLAN.md`)  
**DB:** SQLite (`prisma/schema.prisma` → `provider = "sqlite"`)  
**Stop rule:** No B1–B6 in this step. Owner decisions required before any batch.

---

## A. CONTRACT MATRIX (Appendix S 1.1–9.3)

Legend: **YES** = works end-to-end with named proof · **PARTIAL** = code/UI present with material gap · **NO** = missing or not operable.

| # | Appendix S name | Status | Proof | Gap |
|---|-----------------|--------|-------|-----|
| 1.1 | Business & Requirements Discovery | YES | `docs/week-1/01-business-requirements-discovery.md` | — |
| 1.2 | Site Information Architecture | YES | `docs/week-1/02-site-information-architecture.md` | — |
| 1.3 | UI/UX Design | YES | `docs/week-1/03-uiux-wireframes.md`; plan Parts 03–05 | Visual polish defects remain (see B) |
| 1.4 | Brand-Aligned Visual Design | PARTIAL | Tokens + storefront identity; `components/brand/*` | Admin/trader wallpaper violates Part 01 (clip-art notes); hero contrast/tashkeel issues |
| 2.1 | Product Catalog Engine | YES | `/catalog`; `lib/catalog/*`; categories | — |
| 2.2 | Product Detail Pages | PARTIAL | PDP: `components/storefront/product-gallery.tsx` (`<video controls>`). Admin upload: `components/admin/image-uploader.tsx` `accept` includes `video/mp4,video/webm`; `lib/catalog/images.ts` `ALLOWED_VIDEO`, `kind: "video"`, size cap 48MB | **No magic-byte validation** (MIME only). Not E2E-proven in this audit. Specs depend on seed/admin data |
| 2.3 | Search & Filters | YES | Catalog filters type + price (no trader filter per clarification 1) | — |
| 2.4 | Shopping Cart | YES | `/cart`; cart cookie/store | — |
| 2.5 | Request Finalization Flow | YES | `/request` → `createRetailRequestFromCart` → wa.me | Naming in SECTION-02 uses “Checkout” (see name diffs) |
| 2.6 | Responsive Design | PARTIAL | Responsive layouts exist | No Lighthouse/screenshot matrix in this audit (B6) |
| 3.1 | Trader Registration & Onboarding | YES | Admin creates traders `/admin/traders`; no public self-reg (clarification 2) | — |
| 3.2 | Trader Profile & Deal Preferences | YES | `/trader/profile`; `interestCategorySlugs` / `interestNotes`; `preferences-form.tsx` | SECTION-03 renamed this item (see diffs) |
| 3.3 | Trader Request Visibility | YES | Queries scoped by `traderId`; IDOR scripts `test:week3`, `test:wholesale-security` | — |
| 3.4 | Trader Request History & Status Dashboard | PARTIAL | `/trader/deals`, `/trader/wholesale`, home waiting list | Appendix wording includes “shipped”; wholesale shipping fields absent (8.3). Extra **notifications center** beyond 3.4 (see beyond-S) |
| 3.5 | Public Deals Board for Traders | YES | `/trader/offers` + public `/offers` curated offers | SECTION-03 name remapped to storefront display |
| 3.6 | Deal Approval Workflow | PARTIAL | Admin accept/counter/close on deals | **No visible `rejected` status** — only `closed` (`lib/deals/constants.ts`). Extra **conflict blocking** beyond 3.6 (see beyond-S) |
| 3.7 | Trader-Proposed Deal Requests | YES | `/trader/deals/new` → `proposed` | — |
| 4.1 | Request-to-WhatsApp Handoff | PARTIAL | Storefront + admin: `lib/whatsapp/handoff-adapter.ts` builds bilingual message + `wa.me` deep link; retail service stores payload/link/events | Live Baileys session **not** required by Appendix 4.1 wording, but commercial UI table implies conversation handoff. Live account linking is **9.1**. **Claim “deferred by client decision”: EVIDENCE = NONE** (only invented in SECTION-04) |
| 4.2 | Order Management System | YES | `/admin/requests` list (filter/search/pagination) + `/admin/requests/[id]` | — |
| 4.3 | Internal Order Status Tracking | YES | Transitions + `StatusStepper` + `RetailHandoffEvent` audit; admin activity feed (raw enums — see B/C) | Not customer WhatsApp notifications (9.4 cancelled — correct) |
| 6.1 | Admin Dashboard | PARTIAL | `/admin` KPIs, action queue, activity, WA connection card | Connection shows auth required; activity feed raw Latin; wallpaper P0 |
| 6.2 | Customer Management | PARTIAL | `/admin/customers` list | Customer **detail** drawer/page still deferred (FINAL-QA HP03) |
| 7.1 | Data Encryption & Secure Storage | PARTIAL | bcrypt passwords; JWT (`jose`) + `AUTH_SECRET` | No at-rest encryption story for DB/uploads/WA auth beyond OS filesystem |
| 7.2 | Daily Backup Configuration | NO | No automated backup/restore of DB + uploads + `.wa-auth` | FINAL-QA PL03 deferred |
| 7.3 | QA & Testing | PARTIAL | Node regression scripts (`test:week3`, WhatsApp phase A–E, wholesale-security) | **No Playwright E2E**, no axe/Lighthouse gates in CI |
| 7.4 | Deployment & Launch Support | NO | Local app only; no VPS runbook executed | — |
| 7.5 | Domain & SSL Certificate Setup | NO | Not configured for production domain | — |
| 8.1 | Wholesale Request Submission | YES | `/trader/wholesale/new` modes `request_quote` / `propose_price` | Notes store raw `Mode: propose_price` (C) |
| 8.2 | Wholesale Order Fulfillment Dashboard | YES | `/admin/wholesale` + detail controls | — |
| 8.3 | Wholesale Shipping & Fulfillment Tracking | NO | D37b decided (`carrier`, `trackingReference`, `shippedAt`) in `DECISIONS-ADDENDUM.md` | **Fields absent** from `WholesaleRequest` in schema |
| 9.1 | WhatsApp Business API Connection | PARTIAL | Baileys adapter + worker (`worker/whatsapp-worker.ts`); `.env.example`: `WHATSAPP_CONNECT_ON_START=false`, `WHATSAPP_OUTBOUND_ENABLED=false` | Admin UI: `healthAuthRequired` / «مطلوب مصادقة»; outbound disabled. **No live QR session proven** |
| 9.2 | Unified Conversations Inbox | PARTIAL | `/admin/inbox`, thread, composer | Requires 9.1 connected; outbound blocked when kill-switch off |
| 9.3 | Order-to-Conversation Linking | PARTIAL | Link/unlink actions; reverse link on retail detail | Usable only with real conversations; live link of cart→open chat not automatic |

**9.4** Automatic WhatsApp status notifications to customers — **cancelled** (Appendix clarification 5). Correctly out of scope.

---

### A1. Client-report names vs Appendix S

#### SECTION-02 (`docs/client-report/SECTION-02-CLIENT-DELIVERY-AR.md`)

| # | Report name | Appendix S name | Match? |
|---|-------------|-----------------|--------|
| 2.1 | Product Catalog Engine | Product Catalog Engine | YES |
| 2.2 | Product Detail Pages | Product Detail Pages | YES |
| 2.3 | Search & Filters | Search & Filters | YES |
| 2.4 | Shopping Cart | Shopping Cart | YES |
| 2.5 | Checkout / Request Flow | Request Finalization Flow | **NO** |
| 2.6 | Responsive Design | Responsive Design | YES |

#### SECTION-03 (`docs/client-report/SECTION-03-CLIENT-DELIVERY-AR.md`)

Section title in report: “Vendor Portal & Trader Deals” ≠ Appendix “Trader Deals & Requests”.

| # | Report name | Appendix S name | Match? |
|---|-------------|-----------------|--------|
| 3.1 | Vendor Registration & Onboarding | Trader Registration & Onboarding | **NO** |
| 3.2 | Vendor Deal Status Tracking + تفضيلات | Trader Profile & Deal Preferences | **NO** |
| 3.3 | Vendor Order Visibility | Trader Request Visibility | **NO** |
| 3.4 | Vendor Notifications & Status Center | Trader Request History & Status Dashboard | **NO** |
| 3.5 | Unified Deals Storefront Display | Public Deals Board for Traders | **NO** |
| 3.6 | Deal Conflict Validation Logic | Deal Approval Workflow | **NO** |
| 3.7 | Vendor-Proposed Deals & Promotions | Trader-Proposed Deal Requests | **NO** |

#### SECTION-04 (`docs/client-report/SECTION-04-CLIENT-DELIVERY-AR.md`)

Section title in report: “Orders & Checkout” ≠ Appendix “Orders & WhatsApp Handoff”.

| # | Report name | Appendix S name | Match? |
|---|-------------|-----------------|--------|
| 4.1 | WhatsApp Checkout Handoff | Request-to-WhatsApp Handoff | **NO** |
| 4.2 | Order Management System | Order Management System | YES |
| 4.3 | Real-Time Order Status & Notifications | Internal Order Status Tracking | **NO** |

**Owner decision needed:** which naming set is signed (Appendix S vs commercial table / client reports).

---

### A2. Features beyond / remapped vs Appendix S (owner keep / hide / remove)

| Feature | Where | Relation to S | Decision needed |
|---------|-------|---------------|-----------------|
| **Deal product conflict blocking** | `lib/deals/conflict.ts` → throws `DEAL_PRODUCT_CONFLICT`; called from `lib/deals/service.ts` | **Beyond** 3.6 (approval workflow ≠ auto-block other traders) | keep / hide / remove |
| **Trader notifications center** | `/trader/notifications`, `TraderNotification`, header badge | **Beyond** 3.4 (history/status dashboard) | keep / hide / remove |
| **Trader deal preferences** | profile form + schema interest fields | **Maps to 3.2** — in scope | Confirm naming only |
| **Promo / compareAt UI** | gated by `RO_PROMO_FEATURES` (default off) | Out of Appendix S | Leave gated off unless owner says keep |
| **Visible `rejected` deal outcome** | Missing; only `closed` via action `close` | Appendix 3.6 says “accepts or rejects” | Add explicit rejected **or** accept closed-as-reject labeling |

---

### A3. Deal rejection

- Statuses: `proposed | negotiating | accepted | closed` — [`lib/deals/constants.ts`](../../lib/deals/constants.ts).
- **No `rejected` status or UI label.** Terminal path is `close` → `closed`.
- SECTION-03 note that “مرفوضة” is a practical synonym of closed is a **report claim**, not a product state.

---

### A4. Item 2.2 video — audited state

| Layer | State |
|-------|-------|
| Admin accept attribute | YES — `image-uploader.tsx` includes video MIME types |
| Server attach | YES — `attachProductImage` allows mp4/webm, sets `kind: "video"`, 48MB cap |
| Magic-byte validation | **NO** — trusts `file.type` only |
| PDP playback | YES — `product-gallery.tsx` `<video controls>` (no autoplay) |
| E2E proof this audit | **NOT RUN** |

Verdict for matrix: **PARTIAL** (implemented path exists; hardening + proof incomplete). Reviewer claim “not supported in admin upload” is **outdated relative to current code** unless a runtime bug is found in B3.

---

### A5. Items 4.1 and 9.1–9.3 — live WhatsApp

| Fact | Evidence |
|------|----------|
| wa.me retail handoff | `lib/whatsapp/handoff-adapter.ts`; retail create/retrigger |
| Baileys stack present | `lib/whatsapp/baileys-adapter.ts`, `worker/whatsapp-worker.ts` |
| Connect on start default | `WHATSAPP_CONNECT_ON_START="false"` (`.env.example`) |
| Outbound default | `WHATSAPP_OUTBOUND_ENABLED="false"`; `isOutboundEnabled()` defaults false |
| Admin UI copy | `dict.inbox.healthAuthRequired` / AR «مطلوب مصادقة»; `outboundDisabled` |
| ConnectionCard | `components/admin/connection-card.tsx` — read-only outbound (D32a) |

#### Claim: “deferred by client decision” / «مؤجّل بقرار العميل»

| Source searched | Result |
|-----------------|--------|
| Repo docs for client deferral of live WA | **Only** `SECTION-04-CLIENT-DELIVERY-AR.md` (lines stating مؤجّل بقرار العميل / بقراركم) |
| Git commit messages citing client deferral | **NONE found in prior audit** |
| Week-4 docs | Deferrals are **engineering/ops** (VPS, QR, production session) — not “client ordered postpone” |

**EVIDENCE FOR CLIENT-DECISION DEFERRAL: NONE.**  
That claim must be **removed** from client reports (rewrite in B6). Correct statement: live QR/session/outbound are **not yet completed / not connected**; they remain **contract items 9.1–9.3** (and 4.1 handoff via wa.me is separate).

---

### A6. 8.3 and D28b

| Item | Status | Evidence |
|------|--------|----------|
| 8.3 / D37b shipping fields | **NO** | `WholesaleRequest` has no `carrier`, `trackingReference`, `shippedAt` |
| D28b nullable retail price | **NO** | `Product.retailPrice` / `currency` still required `Decimal` / `String`; on-request via TEST-currency workaround in format helpers |

Schema changes for these are **allowed only after DB backup + migration test** (standing rules).

---

## B. VISUAL DEFECTS

| ID | Sev | Defect | Evidence |
|----|-----|--------|----------|
| V1 | **P0** | Music-note / plectrum **BrandWallpaper** behind admin & trader (and storefront cream chrome) | `components/brand/brand-wallpaper.tsx`; mounted in `components/admin/shell.tsx`, `components/trader/shell.tsx`, `app/(storefront)/layout.tsx`. Violates Part 01: no cartoon/clip-art; grain ≤6% only in hero/footer/plates |
| V2 | **P0** | Arabic hero headline fully vocalized; diacritics can detach visually | `dict.home.headline` = `عُودٌ نَادِرٌ صُنِعَ لِيَبْقَى` in `lib/i18n/dictionaries.ts`; rendered `hero-resonance.tsx` with Amiri (`app/layout.tsx` `--font-amiri`) |
| V3 | **P0** | Hero principles list low contrast (grey/sand on black) | `hero-feature-rail.tsx`: inactive `opacity-35`, detail sand @ ~65% mix |
| V4 | **P1** | Raw English enums in admin activity feed | `lib/admin/dashboard.ts` builds `title: \`${ref} · ${e.eventType|action}\`` — e.g. `prepared`, `submitted`, `trader_accepted`. Dictionaries exist on detail pages but **unused by feed** |
| V5 | **P1** | Test/demo data visible | Seed: `Demo Trader`, `DL-DEMO-WAIT` (`prisma/seed.ts`). `ui-hidden.ts` hides Reg/SEED/REG-* only — **does not hide Demo Trader or DL-DEMO-*** |
| V6 | **P1** | Trader home unbalanced (CTA / empty waiting column) | `app/trader/(protected)/page.tsx` — 7/5 grid; sparse waiting vs dense tasks; CTA also in header (TR-02 in `05-trader-pages.md`) |
| V7 | **P2** | Portal cream gradients + atmosphere rings add visual noise on operational tables | `app/globals.css` `.ro-portal-admin` / `.ro-portal-trader` / `.ro-portal-atmosphere` |

---

## C. RAW STRING SCAN (code evidence — AR UI risk)

Paths where Latin enums/modes/notes can render in Arabic UI:

| Location | Raw string pattern |
|----------|-------------------|
| `lib/admin/dashboard.ts` → ActivityFeed | `eventType` / `action` concatenated into title |
| `lib/wholesale/service.ts` | Event note ``Mode: ${requestMode}`` → `Mode: propose_price` |
| `lib/retail-request/service.ts` | English audit notes (“Initial handoff prepared…”) |
| Detail pages with `?? e.eventType` fallbacks | If dict key missing, Latin leaks |
| Login / action errors | Some English error codes may surface (`Unauthorized`, Zod messages) |

**Runtime route crawl AR+EN + console capture:** **NOT COMPLETED in STEP 1** (no Playwright browser install finished at audit write time). Marked **BLOCKED → B2/B6**.

Hard-coded English audit notes and Mode strings are **confirmed in source**.

---

## D. STANDARDS SCAN

### D1. Tooling

| Tool | Before audit | STEP 1 action |
|------|--------------|---------------|
| Playwright / axe / Lighthouse | **Not in package.json** | Install attempted (`npm install -D @playwright/test@1.49.1 @axe-core/playwright@4.10.1 lighthouse@12.2.1`) |
| Install result | — | **FAILED / BLOCKED** — mass `TAR_ENTRY_ERROR ENOENT` under `node_modules/lighthouse` and `puppeteer-core` (path/space or filesystem contention). `package.json` left **without** those deps. Retry in B5/B6 after clean `node_modules` repair if needed |
| Full axe matrix every route | — | **BLOCKED** (deps + Chromium not installed) |
| Lighthouse mobile Home/Catalog/PDP/Request/Admin/Trader | — | **BLOCKED** same |

Commands reserved for B6 once tooling installs cleanly:

```bash
npm install -D @playwright/test @axe-core/playwright lighthouse
npx playwright install chromium
npx lighthouse http://localhost:3000 --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo
# axe via Playwright fixtures against route list
```

### D2. Code / ops findings (no browser required)

| Area | Finding | Status |
|------|---------|--------|
| Security headers (CSP, HSTS, X-Frame, Referrer) | `next.config.ts` has **no** `headers()` | **FAIL** |
| Login rate limit / lockout | No throttle in `lib/auth/*` or login actions | **FAIL** (FINAL-QA HP05/PL02) |
| Upload validation | Type + size + image dimensions; **no magic bytes** for image/video | **PARTIAL** |
| Backups | No daily backup job for DB + uploads + WA session | **FAIL** |
| Health endpoint | No `/api/health` (or similar) found | **FAIL** |
| Structured logging | Ad-hoc console; no structured logger | **PARTIAL/FAIL** |
| SEO basics | `app/sitemap.ts`, `app/robots.ts`, `lib/seo.ts` present | **PARTIAL** (needs Lighthouse proof) |
| Secrets hygiene | `.env.example` documents WA/auth; auth dir guidance present | **PARTIAL** |
| Dead code / TODO | No `TODO`/`FIXME` in `*.ts(x)` grep this audit | OK note |
| SQLite | Production DB decision memo not written | Open (B5 memo only — do not migrate) |
| Fixture hiding | Incomplete vs Demo/DL-DEMO (see V5) | **FAIL** for demo cleanliness |

### D3. WhatsApp ops readiness

- Session persistence code exists; **production durable path + restore drill not proven**.
- Outbound kill-switch env-only (D32a) — intentional, not a bug.
- Inbox send rate-limit **string** exists for WA compose; **login** rate limit does not.

---

## Owner decisions required before batches

1. **Signed item names:** Appendix S vs SECTION-03/04 (and 2.5 “Checkout”) commercial names?  
2. **Deal conflict rule:** keep / hide / remove?  
3. **Trader notifications center:** keep / hide / remove?  
4. **Rejected deals:** add explicit `rejected` status, or keep `closed` only with clearer reject UX copy?  
5. Proceed with **`GO BATCH 1`** (visual professionalization first)?

---

## Top findings (≤10 lines)

1. **P0 visual:** Note/plectrum wallpaper on admin/trader violates brand plan — remove in B1.  
2. **P0 visual:** Hero Arabic tashkeel + low-contrast principles list.  
3. **False claim:** “Live WhatsApp deferred by client” has **NO written evidence** — only SECTION-04; remove on rewrite.  
4. **9.1–9.3:** Code present; UI shows auth required + outbound disabled; live QR/session not completed.  
5. **8.3 + D28b:** Not in schema — still NO.  
6. **Beyond-S features:** conflict blocking + notifications center need owner keep/hide/remove.  
7. **No `rejected` deal status** — only `closed`.  
8. **Activity feed / Mode notes** leak Latin enums into AR admin UI.  
9. **Demo data:** `Demo Trader` / `DL-DEMO-*` not covered by `ui-hidden`.  
10. **Ops:** no login rate limit, no security headers, no daily backup, no E2E/axe/Lighthouse proof yet; SQLite.

---

**STOP — awaiting owner decisions + `GO BATCH n`.**  
Do not start B1–B6 until instructed. Do not present SECTION-03/04 client reports as-is for tomorrow’s review.
