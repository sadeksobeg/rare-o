# Independent Verification Audit — Phase 9 (Hardening)

**Mode:** read-only verification. No fixes, commits, migrations, or pushes were made.
No throwaway database or test rows were created this session (see §8 for why
DB-backed live tests were not run). This report itself is the only new file.

**Scope read:** `docs/ui-planning/REMAINING-PLAN.md` ("المرحلة 7 — التصليب", the Phase-9
prompt), `docs/ui-planning/evidence/phase-09-hardening.md` (implementer's report),
`docs/ui-planning/AUDIT-PHASE-1.md` (rigor/format model), and the commit history on
`phase/09-hardening` (`3aad9c3`, `138a430`).

---

## 0. Environment note (process finding, not a code defect)

This audit's worktree was initially checked out on an unrelated branch
(`worktree-agent-*` @ `1c7a00c`, a different, already-merged security-hardening track),
not on `phase/09-hardening`. This was caught before any phase-9 file was read, by
running `git log --oneline -5` as instructed and finding it did not match. Fixed via
`git checkout 138a430 --detach` (the branch itself was already checked out in the main
worktree, so a same-name branch checkout was correctly avoided). All findings below are
against `138a430` (descendant of `3aad9c3`, the phase-9 commit), confirmed throughout.

**Governance finding, Critical-adjacent (see §9, C-1):** commit `3aad9c3`'s own message
discloses that it is a "safety-net commit" bundling *seven phases* (3–9) plus VISION
polish and WhatsApp-desk work into one commit, because none of it was committed
incrementally, and that phases 4/5/7/8/9 had **never been through this project's own
independent-audit gate** before now. This directly contradicts `CLAUDE.md`'s "التغييرات
الحقيقية تُنفَّذ بدفعات صغيرة قابلة للتحقق" (real changes land in small, verifiable
batches) rule. It also means this audit cannot cleanly isolate a "Phase 9 diff" — the
diff for `3aad9c3` is phases 3–9 combined — so claims were verified against the
phase-9-labeled evidence file and artifacts, not a scoped git diff.

---

## 1. Quality gate (run independently, this session)

| Check | Result | Note |
|---|---|---|
| `npx tsc --noEmit` | **PASS**, 0 errors | First run showed ~50 Prisma-type errors; root cause was this fresh worktree's `node_modules/@prisma/client` not yet generated (no prior `npm install`/`prisma generate` had run here). After `npm run db:generate`, **clean**. This was an audit-environment gap, not a Phase-9 regression — confirms the implementer's "tsc clean" claim. |
| `npm run lint` (`next lint`) | **PASS** | 0 errors, 2 pre-existing warnings (`cart-provider.tsx`, `text-field.tsx`, both `react-hooks/exhaustive-deps`, unrelated to this phase) — matches the implementer's commit-message claim of "2 pre-existing warnings." |
| `npm run build` | **PARTIAL** | `check-site-env` + `check:placeholders` passed; `next build` **compiled successfully in ~2.5 min**, but the "Linting and checking validity of types" / static-generation phase was still running when this audit's own time budget (3 min timeout) killed it (exit 143). Not re-run with a longer timeout given `tsc`/`lint` were already independently clean. **Not a full build verification — disclosed, not claimed as pass.** |
| `npm run check:i18n` | **PASS** | Printed `i18n OK — 1260 string keys match in AR and EN` and `inline locale ternaries: 53 (ratchet baseline 53)`, exit 0. The script's own printed count (53) **matches its own hardcoded `BASELINE = 53`** in `scripts/check-i18n.ts:64` — the ratchet claim is real, not just "trust me." (Minor: evidence doc says "1217 keys"; live run shows 1260 — stale number in the doc, cosmetic, not a defect — see Low finding L-3.) |
| `test:week3`, `test:wholesale-security`, `test:whatsapp-outbound-safety`, `test:whatsapp-media-store`, `test:whatsapp-jid`, `test:f5-security`, `test:session-invalidation`, `test:d2-restore`, `test:f4-backup-drill`, `test:d1-axe` | **NOT RE-RUN LIVE** | See §8 — no `.env`, no reachable isolated DB; a Postgres was found already listening on `:5432` (apparently from a different concurrent worktree/session) and running mutating test suites against an unknown-owner shared dev DB was judged unsafe for a read-only audit. Verified via static code review + artifact-history review instead (§3, §6, §8). |
| `npm audit` | **Ran, re-verified claim** | See §4. |

---

## 2. SEO — code review (live curl/browser checks out of scope this pass, see §8)

- `lib/seo.ts:84` `organizationJsonLd()`, `:94` `websiteJsonLd()`, `:104` `breadcrumbJsonLd()`
  are real functions, not stubs — each returns a schema.org-shaped object.
- `app/(storefront)/page.tsx:61-70` genuinely renders two
  `<script type="application/ld+json">` tags calling `jsonLdString(organizationJsonLd())`
  and `jsonLdString(websiteJsonLd())` — **wired into the actual home page**, not just
  defined and unused.
- `app/(storefront)/product/[slug]/page.tsx:169-176` genuinely renders a third
  `application/ld+json` script calling `breadcrumbJsonLd([...])` — **wired into the
  actual PDP**, not just defined and unused.
- **VERIFIED (code-level):** the JSON-LD claim is real, implemented, and mounted.
  **NOT VERIFIED (runtime):** actual rendered HTML / JSON validity on a live server —
  descoped this pass (no browser/live-server checks per the mid-audit scope change).

---

## 3. Accessibility (axe) — artifact provenance check, no live re-run (per scope change)

This is the most important finding in this audit. The brief specifically asked to check
whether `docs/pro-readiness/AXE-RESULTS.json` was regenerated this phase or copy-pasted.
**It was not meaningfully regenerated.**

- `git show 3aad9c3 -- docs/pro-readiness/AXE-RESULTS.json` shows the **entire diff is a
  single line**: the `"at"` timestamp changed from `2026-10-28T09:31:39.815Z` to
  `2026-10-31T11:01:50.455Z`. Every other byte — `routeCount: 23`, `pageCount: 92`,
  every one of the 92 per-route/locale/width results, all `violationCount: 0` — is
  **byte-identical** to the pre-phase-9 (Oct 28) run.
- The route list is hardcoded in `scripts/d1-axe-full.mjs:18-38` (`PUBLIC` × 7,
  `ADMIN` × 10, `TRADER` × 6 = 23 routes, matching `routeCount: 23`). It was **not
  updated** to include any of the screens this very phase span (3–8) added per
  `3aad9c3`'s own commit message: no PDP (`/product/[slug]`), no
  `/admin/brokerage`, `/admin/notifications`, `/admin/settings`, `/admin/team`, no
  `/trader/brokerage` — i.e. the brokerage wizard, admin notifications center, admin
  settings, team tab, and the product detail page (the very page this phase's own
  `breadcrumbJsonLd` work targets) were **never scanned**.
- Whether the script was literally not re-run (hand-edited timestamp) or re-run and
  happened to reproduce an identical 92-row result on an unchanged 23-route list, the
  practical effect is the same: **the "92 scans, 0 failures" headline reflects
  accessibility coverage from before most of this phase's actual UI surface existed**,
  not a fresh a11y pass over the hardening-phase application. Per this task's own
  instruction, a live re-run (via Playwright) would settle which of the two it is, but
  that check was explicitly descoped mid-audit to save cost — **not claimed as pass or
  fail, flagged as unverified and stale-by-evidence instead.** See Finding H-1.

---

## 4. npm audit — claim re-verified, holds up

Ran `npm audit --json` independently (870 total resolved deps: 338 prod, 498 dev, 120
optional). Result: **0 critical, 11 high, 14 moderate, 2 low** (27 total) — matches the
evidence doc's "11 high among 27 total."

All 11 high findings traced via `npm ls`:

| Package | Chain | In `dependencies` (prod)? |
|---|---|---|
| `lighthouse`, `puppeteer-core` | direct `devDependencies` | No |
| `@puppeteer/browsers`, `chromium-bidi`, `extract-zip`, `basic-ftp`, `follow-redirects`, `get-uri`, `pac-proxy-agent`, `proxy-agent` | transitive under `puppeteer-core` | No |
| `zod` (the flagged high, GHSA on `zod@3.23.8`) | transitive under `puppeteer-core → chromium-bidi`, **not** the app's own zod | No |

Cross-checked `package.json`: the app's own production `zod` dependency is
`"zod": "^4.6.7"`, and `npm ls zod` confirms the **top-level resolved** `zod` is
`4.6.7` (clean) — the vulnerable `3.23.8` exists only nested under the dev-only
Lighthouse/Puppeteer tooling chain. **Claim VERIFIED: all 11 highs are dev-tooling-only,
none reach the production dependency tree.** The documented "do not `npm audit fix
--force`" decision (would break Puppeteer) is also sound.

---

## 5. Security headers — code review (live curl descoped this pass, see §8)

Statically confirmed in `next.config.ts` / `middleware.ts`:

| Header | Present | Location |
|---|---|---|
| `Content-Security-Policy` (with nonce) | Yes | `middleware.ts:17` |
| `X-Frame-Options: DENY` | Yes | `next.config.ts:9` |
| `X-Content-Type-Options: nosniff` | Yes | `next.config.ts:10` |
| `Referrer-Policy: strict-origin-when-cross-origin` | Yes | `next.config.ts:11` |
| `Permissions-Policy` | Yes | `next.config.ts:13` |
| `Strict-Transport-Security` | Yes | `next.config.ts:37` |

**VERIFIED at the code/config level** — matches the evidence doc's claim. **Not**
independently confirmed via live `curl -I` against a running server this pass (no
browser/live-server checks, per the mid-audit scope change, and no DB to boot the app
against — see §8).

---

## 6. Backup / restore — artifact review, no live drill run this pass

- `scripts/backup-daily.mjs` and `scripts/d2-restore-drill.mjs` were read in full:
  both are real, non-trivial scripts (pg_dump via `lib/pg-tools.mjs`, sha256 of every
  uploads/wa-auth file, per-table row-count comparison against a fresh temp DB, JSON
  report with exit-1 on mismatch) — not stubs that merely log "OK."
- **`docs/pro-readiness/D2-RESTORE-DRILL.json` — credible, looks like a real fresh
  run**, unlike the axe artifact. Diffing `3aad9c3` against the prior (`2026-10-19`)
  version shows genuinely different content: dump size changed (74,778 → 113,416
  bytes), a different sha256, and **new tables that did not exist in the Oct 19
  run** (`BrokerageEvent`, `BrokerageInspection`, `BrokerageQuote`, `BrokerageRequest`),
  consistent with the brokerage feature actually built in phases 6–7. Every table's
  `source`/`restored` counts match (`ok: true`). This is good evidence of an actual
  restore drill against real, current schema — not a copy-paste.
- `docs/pro-readiness/F4-BACKUP-DRILL.json` is a **new file** in `3aad9c3` (+33 lines,
  no prior version) — consistent with the "partial, MinIO image pull denied" claim
  being an honest first attempt rather than a hidden regression.
- **NOT independently re-run this pass**: no `.env`, Docker daemon present (`docker
  --version` returned `29.3.1`) but `docker ps` did not respond within this audit's
  time budget, and a Postgres was already listening on `:5432` from an apparently
  unrelated, already-running session — running a backup/restore drill against it was
  judged unsafe (unknown ownership/state) for a read-only audit. **Disclosed as
  unverified-live, not claimed as reproduced.**

---

## 7. Dead-code / export-vs-import sweep

Ran `ts-prune` against the full `tsconfig.json`. Most of its ~480 hits are expected
Next.js framework exports (`page.tsx` `default`/`dynamic`/`metadata`/`generateMetadata`,
`route.ts` `GET`/`POST`) that `ts-prune` cannot see are consumed by the framework —
**false positives**, not findings. Filtered those out and manually verified the
remainder with `grep` for real external imports (not just the declaring file).

**Real finding — an entire dead alternate homepage, confirmed with grep, not just
ts-prune:**

`app/(storefront)/page.tsx` imports `HeroResonance`
(`components/storefront/home/hero-resonance.tsx`) and the discovery-based homepage
(`HomepageShell`, `CategoryExplorer`, `FeaturedInstrument`, etc.). Checked every file
under `components/storefront/home/` for real importers outside itself:

| File | Imported anywhere else? |
|---|---|
| `hero-resonance.tsx` | Yes — `app/(storefront)/page.tsx` |
| `hero-feature-rail.tsx` | Yes — `hero-resonance.tsx` |
| `section-header.tsx` | Yes — `discovery/category-explorer.tsx` |
| `trust-strip.tsx` | Yes — `app/(storefront)/page.tsx` |
| `hero.tsx` (exports `HomeHero`) | **No** |
| `brand-intro.tsx` | **No** |
| `editorial.tsx` (`HomeEditorial`) | **No** |
| `featured-offer.tsx` (`FeaturedOfferModule`) | **No** |
| `final-cta.tsx` (`HomeFinalCta`) | **No** |
| `home-handoff.tsx` (`HomeHandoff`) | **No** |
| `manifesto.tsx` (`HomeManifesto`) | **No** |
| `oud-editorial.tsx` (`HomeOudEditorial`) | **No** |
| `principles.tsx` (`HomePrinciples`) | **No** |
| `promo-bands.tsx` (`PromoBands`) | **No** |
| `shortcut-strip.tsx` (`ShortcutStrip`) | **No** |

**11 of 15 files in `components/storefront/home/` — a complete alternate home-page
implementation (hero, manifesto, editorial, principles, promo bands, final CTA,
handoff, shortcut strip) — are dead code**, superseded by the discovery/`HeroResonance`
homepage that actually ships. This is exactly the "coded correctly but never mounted"
pattern this audit was specifically briefed to hunt for, and it directly contradicts
this phase's own "Cleanup: dead code... (grep proof)" requirement — the evidence doc's
"Cleanup / i18n" section only discusses i18n ternary migration, with no mention of this.
See Finding H-2.

Other `ts-prune` hits outside Next.js-convention exports were spot-checked
(`components/brand/index.ts`, `components/motion/index.ts`,
`components/storefront/motion/index.ts`) and are barrel re-export files whose named
exports **are** consumed elsewhere via the barrel path — `ts-prune` false positives,
not real dead code (not listed as findings).

---

## 8. What could not be verified live this pass, and why

Per the phase prompt's own emergency protocol ("إذا قال 'لم أستطع التحقق بسبب البيئة':
Not accepted without alternatives tried"), here is exactly what was attempted and why
each live check stopped short:

- **DB-backed test suites** (`test:week3`, `test:wholesale-security`,
  `test:whatsapp-*`, `test:f5-security`, `test:session-invalidation`,
  `test:d2-restore`, `test:f4-backup-drill`): no `.env` exists in this worktree (only
  `.env.example`/`.env.production.example`); `docker ps` did not return within this
  audit's time budget; a direct TCP probe showed Postgres already listening on
  `127.0.0.1:5432` (likely the main worktree's or a sibling session's dev stack) —
  running mutating fixtures against it without knowing its owner/state was judged
  unsafe. **Not attempted further** given the mid-audit instruction to control cost and
  avoid live/browser verification this pass; static code + artifact-history review was
  used instead (§3, §6).
- **`next build`**: did compile successfully; the full run was not given enough time
  (killed by this audit's own 3-minute cap mid type-check phase). Not re-run longer,
  given `tsc --noEmit` and `next lint` were already independently clean. §1.
- **Live `curl` of headers/SEO/robots/sitemap, live axe re-run**: explicitly descoped
  by the coordinator mid-task to save cost ("skip any live dev-server/UI click-testing
  ... just compare the stored AXE-RESULTS.json's timestamp/git history ... don't guess
  a pass/fail"). Followed exactly — see §3 for the artifact-history result instead of a
  live pass/fail.

None of these are claimed as verified-pass; they are reported as not re-run, with the
reason, consistent with the plan's own rule against unexplained "couldn't verify."

---

## 9. Findings by severity

**Critical:** none in the Phase-9 code itself.

**High:**

- **H-1 — The "92 scans, 0 failures" axe claim is not evidence of this phase's actual
  accessibility state.** `docs/pro-readiness/AXE-RESULTS.json` is byte-identical to the
  pre-phase-9 (2026-10-28) run except for its timestamp; the hardcoded route list in
  `scripts/d1-axe-full.mjs` was never updated to include the PDP, admin
  brokerage/notifications/settings/team screens, or trader brokerage wizard that this
  same commit (`3aad9c3`) says it built. The accessibility claim for Phase 9 should be
  treated as **unverified for the actual new UI**, not as a clean bill of health.
  *Recommended next step (not executed, out of scope for a read-only audit): add the
  missing routes to the `ADMIN`/`TRADER`/`PUBLIC` lists in `d1-axe-full.mjs` and re-run
  for a real timestamp + result delta.*

- **H-2 — An entire dead alternate homepage (11 files under
  `components/storefront/home/`) survived this phase's explicit "cleanup: dead code"
  requirement.** `hero.tsx` (`HomeHero`), `manifesto.tsx`, `editorial.tsx`,
  `oud-editorial.tsx`, `principles.tsx`, `promo-bands.tsx`, `final-cta.tsx`,
  `home-handoff.tsx`, `brand-intro.tsx`, `featured-offer.tsx`, `shortcut-strip.tsx` are
  all unimported by anything except themselves, superseded by `hero-resonance.tsx` and
  the discovery-based homepage. Not a security risk, but a direct miss against the
  phase prompt's own line 6 ("Cleanup: dead code, unused dependencies, legacy tokens
  (grep proof)") and the evidence doc does not mention it.

**Medium:**

- **M-1 — Governance: phases 4/5/7/8/9 were never independently audited before now,
  and all of phases 3–9 landed in one safety-net commit (`3aad9c3`) rather than the
  incremental, per-phase, owner-gated commits `CLAUDE.md` requires.** This is disclosed
  by the implementer in the commit message itself, which is the right instinct, but it
  means this "Phase 9 audit" is actually the first independent check on six phases of
  unreviewed work, and no clean phase-9-only diff exists to audit against. Not a
  code defect; a process gap worth the owner's attention given production is live.

**Low:**

- **L-1 — `next build` was not confirmed to complete end-to-end this session** (killed
  mid-type-check by this audit's own time cap after a successful compile). `tsc
  --noEmit` and `next lint` were independently clean, which is strong indirect
  evidence, but a full green `next build` was not directly reproduced here.
- **L-2 — Several live-environment claims (security headers on a running server, SEO
  JSON-LD in rendered HTML, `robots.txt`/`sitemap.xml` rendering, a live axe re-run,
  and the DB-backed security/regression test suites) were not independently re-run
  this pass** — code-level review strongly supports each claim (§2, §5, §7), but this
  is a narrower verification than AUDIT-PHASE-1's live HTTP testing, due to (a) no
  `.env`/reachable isolated DB in this worktree and (b) an explicit mid-audit
  instruction to skip browser/live-server checks for cost. Documented transparently
  rather than guessed.
- **L-3 — Evidence doc's i18n key count is stale.** `docs/ui-planning/evidence/phase-09-hardening.md`
  says "1217 keys"; a live `check:i18n` run on the current tree reports 1260. The
  ternary ratchet number (53/53) is correct and verified; the key count is cosmetic
  drift, not a functional issue.

---

## 10. Overall verdict

No Critical findings against the Phase-9 code itself. Two **High** findings: the axe
accessibility claim is effectively stale and does not cover most of what this phase
span actually built (H-1), and this phase's own "dead code cleanup" requirement missed
an entire 11-file dead homepage implementation (H-2). The backup/restore claim (D2) is
credibly real — its stored artifact shows genuine new data (new brokerage tables,
different dump size/hash) unlike the axe artifact, which is a meaningful positive
signal given production is live. The npm-audit "dev-tooling-only" claim and the
security-header/SEO code-level claims hold up under independent review. A meaningful
slice of this phase's live-environment claims (DB-backed test suites, live curl/axe
checks) could not be independently re-executed in this session for disclosed reasons
(§8) and should not be treated as re-confirmed — only as plausible based on code
review and artifact history. Given the governance finding in §0/M-1 (six prior phases
never independently audited, all landing in one commit), the owner may want audits of
phases 4/5/7/8 as a follow-up, not just phase 9.
