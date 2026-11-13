# RARE OUD — Consolidated status report (to date)

**Branch written on:** `shipping/phase-2` @ will be the commit that adds this file  
**Report date:** 2026-11-13  
**Scope:** documentation only — no code changes, no deploy, no production writes, no new tokens  
**Canonical integration branch (owner decision, chat + this line):** `master` (GitHub HEAD). Local `main` historically mirrored tips; treat `master` as deploy/integration source. Releases ship by **SHA**, not branch name on the VPS.

---

## 0. Executive summary

1. **Live production web** is `7be0c38` (`GET https://rareoud.com/api/health` → `build.sha=7be0c38`, `builtAt=2026-11-13T06:58:14Z`). Evidence: live health JSON + `docs/shipping/S2A-DEPLOY-REPORT.md`.
2. **Live worker** container `6a2dac1e55cc` started `2026-11-12T11:01:16Z`, image id `83c01bdc534f` (= tag `rare-oud-web:pre-s2a-20261113-065814` / pre-2a layers). **Not** rebuilt in the 2a web-only ship. Evidence: `docker inspect` 2026-11-13.
3. **Merged into `origin/master` (tip `ae2d019`)** includes trader R7.2→R9.1 + offers 4:3 (`c15251b`), WA closure/`bfd34dd`, voice fix `d81d098`, shipping Phase 1 `83ee2ea`, Release 2a through `7be0c38` + deploy doc `ae2d019`. **Not deployed beyond `7be0c38`:** nothing after that SHA is on the live web image.
4. **`shipping/phase-2` only (local tip `02edbf3`; ahead of `origin/shipping/phase-2` by 2; not in `origin/master`):** Checkpoint 2b fix `fe38775` + first 2c commit (2b review blockers + evidence) `02edbf3`. **Not deployed.**
5. **Blocked / waiting owner:** STOP-B not written; Phase 2 remainder (full 2c ops/tracking/docs/notifications); notebook rate verification; prod demo product still **published**; owner WA soak / CONNECT policy; no `DEPLOY NOW` for anything after 2a.
6. **WhatsApp:** health reports `whatsapp.state=connected` (2026-11-13 read). Env on web+worker: `WHATSAPP_CONNECT_ON_START=false`, `WHATSAPP_OUTBOUND_ENABLED=true` (`docker exec printenv`). Standing project docs historically said outbound false — **when outbound flipped to true: NOT VERIFIED in this report’s primary sources**.
7. **Shipping data (prod, read-only query in web container):** 259 countries · 39 methods · **88 verified** rates · **7 unverified NOTEBOOK** rates. Demo slug `shipping-calc-demo-oud` still `status=published` on prod.
8. **Top 5 risks:** (1) customer-visible pricing mistakes if unverified rates leak or snapshots stale; (2) WhatsApp ban / outbound enabled while connected; (3) web/worker image skew after web-only deploys; (4) demo product still public on prod; (5) JWT minting precedent for prod smoke (tokens deleted; pattern remains a process risk).

---

## 1. Timeline

| Item | Branch | Commits (SHA range / tip) | Merged into `origin/master`? | Deployed? | Evidence doc |
|---|---|---|---|---|---|
| Trader Round 7 checkpoint | `ui/trader-r72` lineage | See `docs/ui/pilot-trader/ROUND-7-CHECKPOINT.md` | Yes (via R9 merge path into tip that includes `189096a`) | Yes — ancestry of live `7be0c38` | `docs/ui/pilot-trader/ROUND-7-CHECKPOINT.md` |
| Trader Round 7.2 | `ui/trader-r72` | Tip work landed before R8; report `R7.2-REPORT.md` | Yes (`189096a` merge of `ui/trader-r9` includes prior trader work on that line) | Yes — in live ancestry | `docs/ui/pilot-trader/R7.2-REPORT.md` |
| Trader Round 8 | `ui/trader-r8` | `e68be22` | Yes | Yes — in live ancestry | `docs/ui/pilot-trader/R8-REPORT.md` |
| Trader Round 9 | `ui/trader-r9` | `7b4ed13` … `29c3342` | Yes — `189096a` Merge `ui/trader-r9` into `main` (then on `master` tip) | Yes — in live ancestry | `docs/ui/pilot-trader/R9-REPORT.md` |
| Trader Round 9.1 | `ui/trader-r9` | `29c3342` | Yes | Yes — in live ancestry | `docs/ui/pilot-trader/R9.1-REPORT.md` |
| Offers media 4:3 fix | (on line after R9) | `c15251b` | Yes | Yes — in live ancestry | commit message; trader offers UI |
| WhatsApp W1 realtime | `wa/w1-realtime` | through `3de387f` / merge `65d09f5` | Yes | Yes (earlier deploys; superseded by later images) | `docs/ui/wa-w1/ROUND-W1-REPORT.md` |
| WhatsApp W2 media/actions | `wa/w2-media-actions` | `9c5dd6a` … `d4887c4` / merges | Yes | Yes (earlier) | `docs/ui/wa-w2/ROUND-W2-DEPLOY.md` |
| WhatsApp WA-V overlay | `wa/v-overlay-layout` | `b391344` | Yes | Yes (earlier) | `docs/ui/wa-v/ROUND-V-DEPLOY.md` |
| Chat F1.1 / F2 | `chat/f1-fixes`, `chat/f2-unify` | `ac2c765`, `2b8d1d3`, `4e7a8c4` | Yes | Yes (earlier) | `docs/chat/CHAT-F1.1-LID-REPORT.md`, `docs/chat/CHAT-F2-DEPLOY.md` |
| WhatsApp closure RC1 | `wa/closure-rc1` | `bfd34dd` | Yes | Yes — dump/rollback recorded; later superseded | `docs/ui/wa-closure/CLOSURE-REPORT.md` |
| WA R2 outage-alert fix | (on main line) | `44768d8`, docs `5753575` | Yes | Yes (pre-shipping) | `docs/ui/wa-closure/R2-REPORT.md` |
| Voice → ogg/opus PTT | (on main line) | `d81d098` | Yes | Yes — in live ancestry; worker still on pre-2a image layers | commit `d81d098` |
| SH0 shipping audit | docs + early shipping | audit accepted in plan | N/A (doc) | N/A | `docs/shipping/SHIPPING-AUDIT.md`; accepted in `MASTER-EXECUTION.md` §0 |
| Shipping Phase 0 + engine + importer | `shipping/s1` | `2c855ea` | Yes | Schema/data via Phase 1 deploy | `docs/shipping/PHASE-0-FIXES.md`, `PHASE-0-GATE.json` |
| Shipping Phase 1 / STOP-A | `shipping/s1` | `83ee2ea` (+ deploy note `4495ba0`) | Yes | Yes — **prod SHA `83ee2ea`** then later replaced by 2a | `docs/shipping/STOP-A.md` |
| Seed align / notebook shape | `shipping/s1`→`s2a` | `8f6b694`, `92f80e5` | Yes | Import data from Phase 1 remains | `docs/shipping/SEED-DIFF.md` |
| Release 2a (quote API + health build + labels) | `shipping/s2a` | `666337d` … `7be0c38` | Yes | Yes — **live web `7be0c38`** | `docs/shipping/STOP-2A.md`, `docs/shipping/S2A-DEPLOY-REPORT.md` |
| S2A deploy report commit | `shipping/s2a` | `ae2d019` | Yes (`origin/master` tip) | Doc only (no new image) | `docs/shipping/S2A-DEPLOY-REPORT.md` |
| Checkpoint 2b + fix commit | `shipping/phase-2` | `fe38775` | **No** | **No** | `docs/shipping/s2b/STOP.md`, `SEE-FIX.md`, `S2B-FIX-EVIDENCE.json` |
| 2c first commit (2b review blockers) | `shipping/phase-2` | `02edbf3` | **No** | **No** | `docs/shipping/s2b/SEE-2C-FIRST.md`, `S2C-FIRST-EVIDENCE.json` |

**Other notable lines (not shipping Phase 2):** UI pilot / admin redesign (`ui/pilot-world-class`), design-lab, older `phase/0x-*` empty tips, Hostinger/clinic/mailcow on same VPS (co-resident containers visible in `docker ps` — not RARE OUD app code).

---

## 2. Production state (read-only, 2026-11-13)

| Check | Result | Source |
|---|---|---|
| `GET /api/health` | `ok:true`, `db:"up"`, `whatsapp.state:"connected"`, `build.sha:"7be0c38"`, `builtAt:"2026-11-13T06:58:14Z"` | Live fetch |
| Web container | id `baefa9cc656d…`, name `rare-oud-prod-web-1`, image tag `rare-oud-web:prod` → id `a3e717b3ed71`, started `2026-11-13T07:04:34Z`, healthy | `docker ps` / `inspect` |
| Worker container | id `6a2dac1e55cc…`, name `rare-oud-prod-worker-1`, **image id `83c01bdc534f`**, started `2026-11-12T11:01:16Z` | `docker ps` / `inspect` |
| Current web tag | `rare-oud-web:prod` @ `a3e717b3ed71` created `2026-11-13 07:02:38Z` | `docker images` |
| Rollback tags present | `rare-oud-web:pre-s2a-20261113-065814`, `pre-s2a-20261113-064330`, `pre-wa-voice-20261112-105540`, `pre-ship-s1-20261112-102936`, … | `docker images` |
| Latest pg_dump (2a) | `/var/lib/rareoud/backups/rareoud-pre-s2a-20261113-065814.dump` **150K** | `ls -lh` |
| Prior 2a attempt dump | `…/rareoud-pre-s2a-20261113-064330.dump` **150K** | `ls -lh` |
| Phase 1 dump | `…/rareoud-pre-ship-s1-20261112-102936.dump` **111K** | `ls -lh` |
| Migrations on disk in web image | 20 folders under `prisma/migrations` including `20261112120000_shipping_s1_additive`; `prisma migrate status` → **“Database schema is up to date!”** | `docker exec` |
| `RO_GIT_SHA` (web) | `7be0c38baada58821269a2c5762b244d3034defa` | `printenv` |
| `WHATSAPP_CONNECT_ON_START` | web `false`, worker `false` | `printenv` |
| `WHATSAPP_OUTBOUND_ENABLED` | web `true`, worker `true` | `printenv` |
| Shipping counts | countries **259**, methods **39**, verified rates **88**, unverified **7**, notebook source **7** | node query in web `/app` |
| Demo product on prod | `shipping-calc-demo-oud` **published** | same query |

---

## 3. Shipping module

### 3.1 What exists now

| Area | Status | Where / evidence |
|---|---|---|
| Data model | Additive Prisma: countries, methods, rates, history, config, inquiries; product weight/class fields; request `shippingQuoteSnapshot`; `Shipment` / events in schema for later 2c | migration `20261112120000_shipping_s1_additive`; `MASTER-EXECUTION.md` §5 |
| Engine | DB-backed `quote()`; legacy parity + notebook rules; unverified excluded from public | Phase 1 / 2a; `STOP-2A.md` gates `shipping-engine-checks` **3900/0** |
| Quote API | `POST /api/shipping/quote` — rate-limited; ignores client `includeUnverified` | `docs/shipping/s2a/SECURITY-CHECKS.md` **12/12**; live smoke DE 20 → 130/150 USD in `S2A-DEPLOY-REPORT.md` |
| Admin | Hub `/admin/shipping/*` — countries, methods, rates, history, import/export, simulator, config, inquiries | `STOP-A.md` |
| Storefront (live `7be0c38`) | Server-backed selector on request/trader forms; weight labels; health build fields | `STOP-2A.md` / deploy report |
| Storefront (branch only) | PDP estimator, `/shipping` page, searchable combobox, flags, inquiry UX, cart validate, Arabic error map | `fe38775`, `02edbf3`; `docs/shipping/s2b/*` |
| Inquiry flow | Create on retail submit when inquiry; admin Inquiries inbox | Live for Phase 1+; E2E confirmation shots on branch `s2c-lb-confirm-*.png` + `s2c-admin-inquiries-1440-ar.png` (**local next start**, not prod) |

### 3.2 Notebook rates (7)

Authoritative table: `MASTER-EXECUTION.md` §1b + `docs/shipping/shipping-rates-seed.json`.  
Storage: `ShippingRate` rows with `verified=false`, `source=NOTEBOOK`; **not** returned on public quote (`SECURITY-CHECKS.md`).  
Admin simulator may preview with `includeUnverified` / customer-card preview (branch UX).  
**Owner verification of the 7: NOT DONE** (explicitly deferred).

### 3.3 2a vs Phase 1

| | Phase 1 (`83ee2ea`) | Release 2a (`7be0c38`) |
|---|---|---|
| Migrations | Applied `shipping_s1_additive` | **None** |
| Public quote API | Engine existed; storefront still partly static at STOP-A | Wired `ShippingCostSelector` → `/api/shipping/quote` |
| Health | Pre-build metadata incomplete for short SHA | `build.sha` (7) + `builtAt` |
| Deploy mode | Web rebuild + migrate/import | **Web-only** (`--no-deps web`); worker untouched |
| Notebook | 7 unverified imported | Still unverified; still hidden publicly |

---

## 4. Gates and tests

| Checkpoint | Overflow | Console | axe | Other | Ran on | Notes |
|---|---|---|---|---|---|---|
| Trader R7.2 | 0 fails | 0 | 0 | plural/KPI gates | Shot script (local) | `R7.2-REPORT.md` |
| Trader R8 | per report | per report | per report | | Shot script | `R8-REPORT.md` |
| Trader R9 / 9.1 | **0** | **0** | **0** | `ro-portal-*` **0**; tsc/lint pass | `pilot-trader-r91-shots.mjs` | `R9.1-REPORT.md` |
| WA closure | — | — | — | wa-v seed/overlay PASS; chat-f1 38; chat-f2 47; security 25; killswitch 6; tsc/lint | Local + deploy record | `CLOSURE-REPORT.md` |
| Shipping Phase 1 STOP-A | — | — | — | tsc PASS; engine parity prior; admin audit | Local + prod smoke HTTP | `STOP-A.md` |
| Release 2a STOP | UI matrix PASS | — | — | tsc; lint; engine 3900/0; importer idempotent; security **12/12** | Local gates; UI `GATES.json` (note: empty-cart honesty) | `STOP-2A.md`, `s2a/GATES.json`, `SECURITY-CHECKS.md` |
| S2A prod smoke | — | trader crawl no pageerrors | — | quote DE 130/150; admin rates HTTP 200 | Production | `S2A-DEPLOY-REPORT.md` |
| 2b fix | overflow 0 (recorded shots) | — | serious 0; `document-title` **enabled**; excluded rules **none** | | **`next build && next start` :3001** | `s2b/STOP.md`, `S2B-FIX-EVIDENCE.json` |
| 2c-first evidence | overflow 0 | — | serious 0 on recorded shots | text gates **pass 9 / fail 0** | **`next build && next start` :3001** | `S2C-FIRST-EVIDENCE.json` |

**Flaky / disabled / skipped**

| Item | Status | Why |
|---|---|---|
| axe `document-title` | Was briefly disabled in an earlier 2b capture attempt; **re-enabled** for fix/2c-first | HMR/dev title flake — owner forbade disableRules |
| 2a matrix shots on bare `/request` | Honest empty-cart (no selector) | Selector proof used fixture cart — `STOP-2A.md` |
| Admin rates Playwright on Windows | Failed `net::ERR_ADDRESS_INVALID` during S2A prod shot | Substituted authenticated HTTP 200 + DB counts — `S2A-DEPLOY-REPORT.md` |
| WA closure W-G TEST_PHONE | SKIPPED | No owner `TEST_PHONE` — `CLOSURE-REPORT.md` |
| Admin `button-name` axe on simulator chrome | Filtered in 2c-first capture for admin URLs only | Pre-existing unnamed icon buttons outside checkpoint — `scripts/_s2c-fix-shots.mjs` |

---

## 5. Deviations and decisions

| Deviation / decision | Vs what | Reason / authority |
|---|---|---|
| Split Phase 2 into **2a → deploy → 2b → 2c** instead of one STOP-B then release | `MASTER-EXECUTION.md` §11 single Phase 2→STOP-B→DEPLOY | Owner wrote `DEPLOY NOW` for 2a; then accepted 2a and ordered 2b/2c with no deploy until next `DEPLOY NOW` |
| Deferred full static prototype gallery at STOP-A | MASTER §10 item 7 | Owner: complete Phase 1 + deploy; Phase 2 surfaces deferred — `STOP-A.md` |
| Client selector still static at Phase 1 ship | MASTER §6 server-authoritative UX | Intentional for that ship; fixed in 2a — `STOP-A.md` |
| Did not verify notebook rates | MASTER verification path | Owner: do not verify — leave `verified=false` |
| Folded remaining 2b defects into **first 2c commit** and continued without waiting | Strict STOP between 2b/2c | Owner message: first commit of 2c, then continue; no deploy |
| Minted production JWTs for S2A smoke | Prefer password login / dedicated smoke account | Done inside web container with `AUTH_SECRET` + `jose` `SignJWT` for **`admin@rareoud.com`** and **`trader@rareoud.com`**; cookies `ro_admin_session` / `ro_trader_session`; **no passwords printed**; files `/tmp/s2a-*.token` (+ helpers) on VPS and local **deleted after owner asked** (chat answer recorded in agent transcript compaction). Validity: short-lived JWT (script used ~12h class expiry in later local capture scripts; **exact prod smoke TTL: NOT RE-VERIFIED from remaining files because deleted**) |
| Local-only draft of demo product | Prod still published | Owner: hide locally; prod via admin later — `s2b/STOP.md` |
| Canonical branch = `master` | Earlier `main` usage | Owner Q3 answer after 2a |
| `WHATSAPP_OUTBOUND_ENABLED=true` on live web+worker | Standing CLAUDE.md / many reports saying outbound false | **Observed 2026-11-13 via printenv.** Change authorship/date: **NOT VERIFIED** in this report |

---

## 6. Known defects and open items

### 6.1 Owner’s 2b fix list (status after `02edbf3`)

| # | Defect | Status | Evidence |
|---|---|---|---|
| 1 | Raw `INVALID_PRODUCT` on request; LB inquiry unproven | **Fixed** (code + local E2E shots) | `lib/retail-request/error-copy.ts`, cart validate API, `s2c-lb-confirm-*.png`, inquiries shot |
| 2 | Simulator title raw `JO`/`SA` | **Fixed** | `simulator-panel.tsx`; `s2c-sim-jo-cards-1440-ar.png` |
| 3 | PDP `$US` price format; huge amount | **Fixed** format; amount is seed `21832` USD | `lib/i18n/format.ts`; `S2C-FIRST-EVIDENCE.json` priceNote |
| 4 | PDP 390 estimator header-only; duplicate feature line | **Fixed** (open cards shot + specs-only features) | `s2c-pdp-estimator-open-390-ar.png`; product page change |
| 5 | Country picker UX + JO flag | **Fixed** (searchable trigger+search; JO SVG triangle+star at 2x crop) | `s2c-picker-open-390-ar.png`, `s2c-crop-jo-flag-2x.png` |
| 6 | Simulator shots cut under watermark | **Fixed** scrolled JO/SA(+AE/LB) shots | `s2c-sim-*-1440-ar.png` |
| 7 | Consent vs optional WA updates | **Fixed** dictionary copy | `lib/i18n/dictionaries.ts` |

**Owner acceptance of corrected 2c-first shots: NOT VERIFIED** (delivered; awaiting judgment).

### 6.2 Other open / unproven

| Item | Status |
|---|---|
| Full 2c: trader شحناتي filters/timeline/docs, `/track/[token]`, admin shipment ops, COMPLIANCE + RUNBOOK, notification wiring | **Scaffold only** (`app/trader/.../shipments/page.tsx`, `lib/shipping/trader-shipments.ts` in `02edbf3`) — remainder not done |
| STOP-B pre-deploy package | **Not started** |
| Prod demo product unpublished | **Still published** on prod (query) |
| Notebook 7 verification | **Not started** |
| Independent audits phases 4/5/7/8/9 | Historically open in `CLAUDE.md` — **NOT RE-AUDITED this session** |
| Uptime monitor | **NOT VERIFIED** |
| Dedicated smoke account | **Not created** |
| Worker rebuilt with same SHA as web | **No** — worker still `83c01bdc534f` |

---

## 7. Open decisions (owner)

| ID | Topic | Notes |
|---|---|---|
| D7 | Volumetric divisor + box dimensions | MASTER: divisor blank/disabled by default; packaging 0 — confirm before enabling |
| D8 | Who enters product weights | Product `weightKg` optional; heuristic fallback — owner process TBD |
| — | Verify 7 notebook rates | Admin اعتماد; until then public-hidden |
| — | Demo product `shipping-calc-demo-oud` | Unpublish/archive on **prod** via admin |
| — | WhatsApp reconnect / soak / `CONNECT_ON_START` | Health already `connected`; CONNECT still `false`; outbound **true** — confirm intended policy |
| — | Uptime monitor | Still open |
| — | SSH deploy key | Pubkey documented in `STOP-2A.md`; VPS access from this machine works for read-only checks |
| — | Dedicated smoke account | Avoid minting JWTs for `admin@` / `trader@` |

---

## 8. Remaining plan

### 8.1 Left in 2c (honest)

- Trader شحناتي: real list/filters/status chips/timeline/docs (beyond scaffold)
- Public `/track/[token]`
- Admin shipment create/status/exceptions/bulk
- Print documents (HTML→PDF)
- In-app notifications + WhatsApp milestone rules (opt-in + inbound only)
- `COMPLIANCE-NOTES.md`, `SHIPPING-RUNBOOK.md`
- Backfill dry-run counts for existing wholesale/brokerage with carrier data
- Regression battery listed in MASTER §11
- **STOP-B** report with exact migration SQL list (even if empty), gates, worker-compat, rollback

**Estimate:** ~3–5 focused work sessions for remaining 2c + STOP-B (not calendar days). Depends on how much ops UI is required for v1 vs deferred.

### 8.2 STOP-B contents (required)

Gates table; migration SQL list; import/backfill dry-runs; prod read-only counts; worker-compatibility analysis; screenshots with distinct SEE; rollback plan; confirmation WhatsApp/worker untouched.

### 8.3 After owner `DEPLOY NOW`

1. `pg_dump` → timestamped path under `/var/lib/rareoud/backups/`
2. Tag running web image `rare-oud-web:pre-<label>-<ts>`
3. Build web with `GIT_SHA` / `BUILD_TIME`; `docker compose … up -d --no-deps web`
4. Smoke: health SHA, quote DE, admin shipping, trader routes, logs
5. **Do not** restart worker unless owner explicitly orders a worker ship

### 8.4 Rollback

Retag/run previous `rare-oud-web:pre-*` on web. Schema additive → dump restore optional if no destructive migration. Worker left alone in web-only ships.

---

## 9. Risk register

| Risk | Likelihood | Impact | Mitigation in place |
|---|---|---|---|
| Wrong/missing shipping price shown to customers | Med | High | Server quote; unverified excluded; security checks 12/12; snapshots on submit (Phase 1+) |
| WhatsApp ban / unwanted outbound | Med | High | CONNECT_ON_START false; outbox/kill-switch design; **but OUTBOUND_ENABLED=true observed** — policy confirmation needed |
| Snapshot / rate history integrity | Low–Med | High | Rate history + revert; immutable quote snapshots on requests |
| Migration safety | Low (additive to date) | High | Additive-only rule; dumps before deploys; STOP-B must list SQL |
| Worker/web skew | High (current state) | Med | Web-only deploys by design; worker image older — WA path must stay compatible |
| Demo / fixture products confuse customers | Med (demo published) | Med | Local draft; prod still published — owner action |
| Prod JWT minting process risk | Low if stopped | High | Tokens deleted; prefer dedicated smoke account going forward |

---

## Appendix — quick SHA cheat sheet

| Role | SHA |
|---|---|
| Live web | `7be0c38` |
| `origin/master` tip (includes deploy doc) | `ae2d019` |
| Phase 1 deploy | `83ee2ea` |
| WA closure deploy | `bfd34dd` |
| Voice fix | `d81d098` |
| Offers 4:3 | `c15251b` |
| 2b fix (branch only) | `fe38775` |
| 2c-first (branch only) | `02edbf3` |

---

*End of report.*
