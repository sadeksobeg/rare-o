# Final QA checklist (running)

**Purpose:** Capture everything deferred from slice reports so nothing is lost.  
**Owner:** Cursor runs this list at the end of the UI plan slices (automated where possible).  
**Rule:** Lint/tsc/build success does **not** mark visual/a11y items pass — those need axe / Lighthouse / screenshots / listed manual steps.

**Status legend:** `deferred` · `pass` · `fail` · `blocked` · `n/a`

---

## Cross-cutting (all slices)

| ID | Check | Source | How | Status |
|----|-------|--------|-----|--------|
| X01 | Keyboard: Tab / Shift+Tab through primary flows | Part 06 §4 | Manual + Playwright if available | deferred |
| X02 | Menus: Arrow / Esc / Home / End | Slice B1 P09 | Manual on `/dev/ui#p2-b1` | deferred |
| X03 | Tabs: roving tabindex + arrows (RTL-aware) | Slice B1 P10 | Manual on `/dev/ui#p2-b1` | deferred |
| X04 | Dialogs: Esc closes, focus returns to trigger | Slice B2 P08 | Manual on `/dev/ui#p2-b2` | deferred |
| X05 | RTL mirroring: chevrons, breadcrumbs, pagination, steppers | B1–B2, C | Screenshots AR vs EN | **pass** (dir=rtl on AR; visual matrix in `final-qa/`) — owner still compares chevrons |
| X06 | `.ro-inverse` contrast (text, borders, controls) | B1–B2 | Screenshots + axe | deferred → owner + axe |
| X07 | Viewport 390 — no horizontal scroll on key pages | C+ | Screenshots / Lighthouse | **fail** on `/` only (hero field overflow-visible); catalog/admin/trader **pass** — see `FINAL-QA-REPORT.md` |
| X08 | Viewport 768 | C+ | Screenshots | **fail** on `/` only (same) |
| X09 | Viewport 1440 | C+ | Screenshots | **fail** on `/` only (same) |
| X10 | `prefers-reduced-motion: reduce` (no ripple/shimmer/parallax) | B1–B2 | DevTools emulate | **pass** (CDP emulate in final-qa-run) |
| X11 | Screen-reader: live regions (toast), switch state, tabs | B1–B2 | VoiceOver/NVDA or axe | deferred (manual) |
| X12 | axe-core critical/serious = 0 on sampled pages | Final | axe | **blocked** — not bundled; owner DevTools |
| X13 | Lighthouse a11y / best-practices targets (document scores) | Final | Lighthouse | **blocked** — owner run; document scores |

---

## Slice A — Status / KPIs

| ID | Check | Status |
|----|-------|--------|
| A01 | New storefront request increments retail KPI (script `test:slice-a-kpi`) | pass (automated) |
| A02 | Visual: KPI tiles show correct Arabic labels after create | deferred → covered by Slice C shots |

---

## Slice B1 — P2 primitives batch 1

| ID | Check | Status |
|----|-------|--------|
| B101 | `/dev/ui#p2-b1` light + `.ro-inverse` screenshots AR/EN | deferred |
| B102 | Select / Checkbox / Radio / Switch keyboard + hit areas | deferred |
| B103 | Menu Popover API + keyboard | deferred (see X02) |
| B104 | Tabs roving + mobile edge fade | deferred (see X03) |

---

## Slice C — Dashboard AD-02

| ID | Check | Status |
|----|-------|--------|
| C01 | Screenshots `/dev/ui/dashboard` @ 390 / 768 / 1440 × AR / EN → `docs/ui-planning/screenshots/slice-c/` | **pass** (6 PNGs; live data mirror of `/admin`) |
| C02 | Mobile order: KPIs 2×2 → ConnectionCard → ActionQueue → ActivityFeed | **pass** (CSS order + 390 shots) |
| C03 | KPI zero state shows idle success copy | **pass** (shots: لا شيء بانتظارك / Nothing waiting) |
| C04 | ActionQueue: nextActor=admin only, oldest first, max 8, فتح link | **pass** (code + shots; ≤8 rows) |
| C05 | ActivityFeed: last 10 union events, each links to record | **pass** (code + shots) |
| C06 | ConnectionCard: outbound read-only (no Switch) per D32a | **pass** (shots: phrase only, no Switch) |
| C07 | No “published products” metric in KPI row / header | **pass** (removed from page) |
| C08 | New retail request appears in KPI + queue after refresh | **pass** — `scripts/slice-c-c08-kpi-queue.ts` (RO-2026-2033; KPI 0→1; ActionQueue hit; cleaned) |
| C09 | Real `/admin` 1440 AR screenshot (logged-in) | **pass** — recaptured full 1440 with sidebar: `screenshots/slice-c/real-admin-1440-ar.png` |
| C10 | Activity RO-2026-9446 “prepared” while retail KPI = 0 | **explained (not a bug)** — request `status=cancelled`, `nextActor=none`; ActivityFeed is append-only event log (prepared event remains after cancel/test cleanup). KPI counts open admin-owned statuses only. |
| C11 | Outbound wording not duplicated (“Outbound: Outbound disabled”) | **pass** — ConnectionCard shows `inbox.outboundDisabled` / `outboundEnabled` alone (no `admin.outbound:` prefix) |
| C12 | Quick-action links styled as buttons | **pass** — Product / Offer / Trader / Open inbox use `ButtonLink` `variant="secondary"` |

---

## Slice D — Home H1–H9 (D41b)

| ID | Check | Status |
|----|-------|--------|
| D01 | Home stack order H1→H9 (no ShortcutStrip / accessories rail) | **pass** (code + a11y tree) |
| D02 | Screenshots `/` @ 390 / 768 / 1440 × AR / EN → `screenshots/slice-d/` | **pass** — viewport shots + `home-ar-1440-hero.png` |
| D02b | Full-page Home AR @ 1440 & 390 (H1→H9 + footer) | **pass** — `home-ar-1440-full.png`, `home-ar-390-full.png` |
| D03 | Hero headline ≤ 3 lines at 390 & 1440 | deferred (visual owner check) |
| D04 | Sections hide when empty (0 offers, 0 featured) — no empty shells | **pass** — conditional render + assert no empty shells; optional H3–H6 noted when absent |
| D05 | `#story` anchor from hero “قصتنا” | **pass** (href `#story` on EditorialSplit) |
| D06 | EditorialSplit / HandoffExplainer / TrustStrip / TraderBand present | **pass** (DOM + full-page shots) |
| D07 | Over-hero header overlays hero (hero at y=0); solid sand-100 after 80px | **pass** — opaque `bg-[var(--ro-sand-100)]` (no `/95` blur grey); assert bg=`rgb(244,231,216)`; shot `home-ar-1440-scrolled-header.png` |
| D08 | Hero copy visible by default (opacity 1); motion must not gate content | **pass** |
| D09 | Automated assertions @ 1440 & 390 | **pass** — `scripts/slice-d-hero-assert.mjs`: hero + H1→H9 order/non-empty + scrolled cream + 390 rings below headline; ALL PASS |
| D10 | 390 AR rings do not clash with headline | **pass** — rings moved below copy (`data-hero-rings-mobile`, opacity 0.18); assert ringsTop ≥ h1Bottom |
| D11 | Editorial H7 placeholder copy before launch | **deferred (pre-launch)** — H7 still shows client-replaceable placeholder (e.g. «محتوى تحريري قابل للاستبدال» / editorial stub). Must be replaced with approved client copy before go-live. |
| D12 | Product cards use shared editorial photography | **deferred (assets)** — until real product photography arrives, cards reuse shared editorial images; prepare **3 photos per SKU** for handoff. |
| D13 | Full-width Home 1440 AR (uncropped) | **pass** — `screenshots/slice-d/home-ar-1440-full.png` + viewport `home-ar-1440.png` (exact 1440 CDP); owner noted a cropped copy in transit — re-verify against these files |

---

## Slice Home Visual — Hero mark + cream motif + buttons

| ID | Check | Status |
|----|-------|--------|
| HV01 | H1 photographic branded oud + resonance overlays + motion | **pass** |
| HV01b | Home density pass: trust/editorial/handoff/trader + elevated buttons | **pass** |
| HV02 | Cream storefront canvas has low-opacity `CanvasMotif` (not over inverse bands) | **pass** |
| HV03 | `Button`/`ButtonLink` polish + ripple on `inverse-primary`; hero secondary = `inverse-secondary` | **pass** |
| HV04 | Screenshots AR @390/768/1440: viewport + hero clip + cream band | **pass** — `screenshots/slice-home-visual/` |
| HV05 | Mobile mark below headline (`data-hero-rings-mobile` assert still holds) | **pass** — assert script |

---

## Slice E — Admin inbox AD-03

| ID | Check | Status |
|----|-------|--------|
| E01 | 3-pane ≥1280 (list 340 / thread flex / context 320); 1024–1279 context drawer; <1024 list↔thread + context Sheet | **pass** — layout + `InboxContextShell` Dialog sheet; shots `thread-ar-1440` |
| E02 | A18 connection banner — 5 states, dict only, no technical text | **pass** — `InboxConnectionBanner`; CONNECTED thin line; AUTH/ERR/DISC danger+action; paused attention |
| E03 | A13 tabs الكل/غير مقروءة/مرتبطة/غير مرتبطة + search name/phone | **pass** — `InboxConversationList` |
| E04 | A14 bubbles RTL, delivery icons, retry once/click, day separators, non-text placeholder | **pass** — `MessageBubble` + `adminRetryWhatsAppMessageAction` (requeue same row, no duplicate) |
| E05 | A15 composer disabled reasons, Enter/Shift+Enter, length counter | **pass** — `InboxComposer`; dict disconnected/paused/rateLimited |
| E06 | A16/A17 LinkedRecordPanel + RecordPicker | **pass** — confirm link/unlink Dialogs; search action |
| E07 | Sidebar auto-collapses to 72px on inbox route | **pass** — `data-admin-sidebar=collapsed` w=72 |
| E08 | Screenshots real `/admin/inbox` + conversation @ 390/768/1440 × AR/EN | **pass** — 12 PNGs in `screenshots/slice-e/` (retaken exact widths; JWT auth; nextjs-portal hidden) |
| E09 | Assert: no overflow @390; composer keyboard-reachable; RTL bubble mirror | **pass** — live CDP @1440/390: overflowX=false; composer reachable @vh=480; mirrored outLeft≠inLeft; sidebarW=72 |
| E10 | Collapsed sidebar uses lucide icons + aria-label/title (not single letters) | **pass** — `AdminSidebar` `NAV_ICONS` + `aria-label`/`title` from dict; visible label when expanded |
| E11 | Inbox subtitle manager-facing (no “demo/database” copy) | **pass** — `inbox.subtitle` = «محادثات واتساب» / «WhatsApp conversations» |
| E12 | Composer safe-area inset from left edge (focus ring visible) | **pass** — thread composer `ps-[max(1.25rem,env(safe-area-inset-left))]` + focus-visible ring on textarea |

---

## Slice F — Trader TR-02 / T04–T06

| ID | Check | Status |
|----|-------|--------|
| F01 | Deal wizard T04: steps طلب/شروط/مراجعة, sessionStorage draft, leave confirm, review edit | **pass** — `NewDealForm` + `Wizard`; draft key `ro-trader-deal-draft` |
| F02 | ProductPicker T05: grid, search, category chips, QtyStepper, **no prices**, max qty message | **pass** — `ProductPicker` + `maxQtyPerPiece` |
| F03 | BuilderSummaryBar T06 → review Dialog submit | **pass** — sticky bar + Dialog review sheet |
| F04 | DealCard «بانتظارك» from nextActor on home + deals list | **pass** — home waiting uses `DealCard` + `waitingOnYou` |
| F05 | TR-02 home: greeting, waiting, TaskCards, offers rail, recent Timeline | **pass** — `/trader` blocks present |
| F06 | Screenshots 390/768/1440 × AR/EN → `screenshots/slice-f/` | **pass** — home / deal-wizard / wholesale (exact CDP widths) |
| F07 | Wizard intro one-line trader copy (no internal admin rules) | **pass** — `newDealLead` shortened AR/EN |
| F08 | Wholesale cards: category not slug; no “demo” product titles | **pass** — picker hides slug; seed names cleaned |
| F09 | Wizard desktop width ~720 / content 1120; step header same baseline AR/EN | **pass** — `Wizard` `max-w-[45rem]`; stepOf+title inline |
| F10 | Home «صفقاتي (n)» styled control; summary bar count+CTA grouped | **pass** |
| F11 | Extra shots: wizard step2 + review @390 AR; wholesale review 2 items; deal waiting banner | **pass** — `deal-wizard-step2-ar-390`, `deal-wizard-review-ar-390`, `wholesale-review-ar-390`, `deal-waiting-ar-390` |

---

## Slice G — Storefront P4 PARTIAL (except Home)

| ID | Check | Status |
|----|-------|--------|
| G01 | SF-02 mobile filters open as Sheet; «عرض {n} قطعة» closes | **pass** — `FilterBar` + `Sheet` |
| G02 | SF-10 404 search + `noindex` | **pass** — form → `/catalog?q=` + robots meta |
| G03 | SF-07 ask-about CTA → `/request?offer=` + notes prefill (no auto-add) | **pass** |
| G04 | SF-05 consent **below** submit; phone placeholder + helper «مع رمز الدولة» | **pass** |
| G05 | SF-09 sticky TOC + sectioned **PLACEHOLDER** legal copy | **pass** — banner + `[PLACEHOLDER]` bodies |
| G05b | **Replace privacy text before launch** (client/legal) | **deferred (pre-launch)** |
| G06 | Home (SF-01) untouched in this slice | **n/a** |
| G07 | SF-03 compact HandoffExplainer in sticky info column | **pass** |
| G08 | SF-04 desktop aside read-only name × qty list | **pass** |
| G09 | SF-10 error contact link; `catalog/loading.tsx` (filter + 8×4:5) | **pass** |
| G10 | Screenshots AR @390/768/1440: catalog+sheet, 404, offer, request, PDP, privacy | **pass** — `screenshots/slice-g/` |

### Deferred (post-portal polish)

| ID | Item | Status |
|----|------|--------|
| GP01 | Extract S14 RequestLine / S16 RequestSummary components | deferred |
| GP02 | SF-05 two-column request layout + line summary | deferred |
| GP03 | SF-03 full gallery / lightbox polish | deferred |
| GP04 | SF-06 offers list layout parity | deferred |

---

## Slice H — Admin P5 light punch (AD-01…11 PARTIAL)

| ID | Check | Status |
|----|-------|--------|
| H01 | AD-05 deals list بانتظارك via `dealNextActor` + last entry | **pass** |
| H02 | AD-06 wholesale list بانتظارك + shipping placeholder (— until D37b) | **pass** |
| H03 | AD-04 requests: handoff column + items + relative created | **pass** |
| H04 | AD-07 publish guard: Arabic name + ≥1 image | **pass** |
| H05 | AD-09 publish guard: titleAr + summaryAr + product or plate ack | **pass** |
| H06 | AD-01 login `noindex` + dict-backed `LOGIN_INVALID` | **pass** |
| H07 | AD-10 customers last-request column | **pass** |
| H08 | AD-11 trader create: server temp password + show-once Dialog | **pass** |
| H09 | Screenshots AR @390/768/1440 admin lists + login | **pass** — `screenshots/slice-h/` |

### Deferred (not light / blocked)

| ID | Item | Status |
|----|------|--------|
| HP01 | AD-06 carrier / tracking / shippedAt (D37b) | deferred |
| HP02 | AD-05 NegotiationThread timeline | **pass** — `NegotiationThread` + Timeline; shots `slice-j/deal-thread-*` |
| HP03 | AD-10 customer detail drawer | deferred |
| HP04 | AD-03 drawer vs Sheet at 1024–1279 | deferred |
| HP05 | AD-01 real rate-limit throttle | deferred |

---

## Slice I — Trader remaining PARTIAL (a)

| ID | Check | Status |
|----|-------|--------|
| I01 | TR-03 deals tabs (الكل / بانتظاري / قيد التفاوض / مغلقة) + mobile FAB | **pass** (code) |
| I02 | TR-05 deal detail Banner بانتظارك when nextActor=trader | **pass** — `deal-detail-waiting-ar-390.png` |
| I03 | TR-07 wholesale list tabs + FAB | **pass** (code) |
| I04 | TR-01 login WhatsApp account-request help + noindex | **pass** |
| I05 | TR-09 offers list EmptyState / cards; TR-10 profile read-only | **pass** (code) |
| I06 | Screenshots AR @390/768/1440 → `screenshots/slice-i/` | **pass** (capture script) |
| I07 | ui-hidden extended: deals / wholesale / traders (+ `RO_SHOW_UI_FIXTURES`) | **pass** |

---

## Slice J — Admin remaining PARTIAL (b)

| ID | Check | Status |
|----|-------|--------|
| J01 | A19 NegotiationThread on admin + trader deal detail | **pass** |
| J02 | Admin deals/requests/wholesale/products: status tabs + search | **pass** |
| J03 | Screenshots AR @390/768/1440 → `screenshots/slice-j/` | **pass** |

---

## Pre-launch (not code slices) — owner decisions

| ID | Item | Status |
|----|------|--------|
| PL01 | **Production database:** SQLite OK for tiny single-node; prefer **Postgres** for daily backups + concurrent admin/trader use | deferred (decision) |
| PL02 | **Login rate limiting** (admin + trader) — real throttle, not copy-only | deferred (HP05) |
| PL03 | **Backups** schedule + restore drill (DB + WhatsApp auth dir) | deferred |
| PL04 | Replace **privacy** placeholder legal text with owner counsel copy | deferred |
| PL05 | **Real product photography** (replace plates / seed shots where still demo) | deferred |
| PL06 | **Editorial copy** pass (home, offers, contact, trader help) | deferred |
| PL07 | Confirm `RO_SHOW_UI_FIXTURES` is **unset** in production (regression rows hidden) | deferred |

---

## Notes for final run

1. Prefer **axe** + **Lighthouse** + **browser screenshots** (Cursor browser / Playwright if already installed — do **not** add a new dependency solely for QA).
2. If a tool is unavailable, leave a **manual step** for the owner and mark `blocked` with reason.
3. Update this file’s Status column when each item is executed; do not delete deferred rows.
4. Slice D helpers (no new deps): `scripts/slice-d-hero-assert.mjs`, `scripts/slice-d-capture.mjs` (system Chrome + CDP).
5. Do **not** tell the client the product is “operationally ready” until this checklist + PL* items are closed or explicitly deferred by the owner.
