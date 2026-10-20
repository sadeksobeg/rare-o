# ROUND F — Verification matrix (F0)

**Date:** 2026-10-20  
**Legend:** STATUS is **PROVEN** only when command output or a CI run link exists **on 2026-10-20**; otherwise **UNPROVEN**. CI-only gates with no git remote are **BLOCKED** (note: no git remote).

| ID | Round | REQUIRED | DELIVERED (path) | PROVEN (cmd or CI) | STATUS |
|----|-------|----------|------------------|--------------------|--------|
| E1-01 | E1 | Lighthouse budget script (5-run median) | `scripts/e1-lh-budget.mjs` | `npm run test:lh-budget` → `docs/pro-readiness/LIGHTHOUSE.json` (2026-10-19) | UNPROVEN |
| E1-02 | E1 | Storefront LH Home ≥ 0.85 median | `docs/pro-readiness/E1-PERF-REPORT.md` | `E1-LH-RESULTS.txt` median **0.82** (2026-10-19) | UNPROVEN |
| E1-03 | E1 | Storefront LH Catalog ≥ 0.85 | `docs/pro-readiness/E1-PERF-REPORT.md` | `E1-LH-RESULTS.txt` median **0.81** (2026-10-19) | UNPROVEN |
| E1-04 | E1 | Storefront LH Product ≥ 0.85 | `docs/pro-readiness/E1-PERF-REPORT.md` | `E1-LH-RESULTS.txt` median **0.80** (2026-10-19) | UNPROVEN |
| E1-05 | E1 | Storefront LH Request ≥ 0.85 | `docs/pro-readiness/E1-PERF-REPORT.md` | `E1-LH-RESULTS.txt` median **0.84** (2026-10-19) | UNPROVEN |
| E1-06 | E1 | Admin/Trader soft LH ≥ 0.85 | `docs/pro-readiness/E1-PERF-REPORT.md` | medians **0.87** admin/trader (2026-10-19) | UNPROVEN |
| E1-07 | E1 | Perf measure on prod build not dev | `docs/pro-readiness/E1-PERF-REPORT.md` | `E1-BUILD-LOG.txt` standalone `:3001` (2026-10-19) | UNPROVEN |
| E1-08 | E1 | Caddy Brotli/HTTP2 edge measure | `deploy/Caddyfile.perf` | Not run — direct Next only per E1 report | UNPROVEN |
| E1-09 | E1 | Lighthouse budget JSON gate | `lighthouse-budget.json` | wired in `test:lh-budget` (no 2026-10-20 run) | UNPROVEN |
| E1-10 | E1 | Hero/LCP image optimizations | `components/brand/hero-oud-field.tsx` | code only; no fresh LH delta log | UNPROVEN |
| E1-11 | E1 | Catalog image weight fixes | `components/storefront/catalog/product-card.tsx` | code only; hover removed in E1 (F2 to restore lazy) | UNPROVEN |
| E1-12 | E1 | Homepage cache / revalidate strategy | `app/(storefront)/page.tsx` | `unstable_cache` 60s — no mutation freshness test | UNPROVEN |
| E2-01 | E2 | Zero unconditional E2E skips | `docs/pro-readiness/E2-SKIP-AUDIT.md` | audit doc (2026-10-19); no 2026-10-20 grep log | UNPROVEN |
| E2-02 | E2 | Playwright multi-browser projects | `playwright.config.ts` | config present; no 2026-10-20 matrix run | UNPROVEN |
| E2-03 | E2 | Global E2E seed pipeline | `e2e/global-setup.ts`, `e2e/ensure-seed.ts` | files present; no run log today | UNPROVEN |
| E2-04 | E2 | Unit-style checks script | `scripts/e2-unit-checks.ts` | `npm run test:e2-unit` (not re-run 2026-10-20) | UNPROVEN |
| E2-05 | E2 | Load smoke p95 script | `scripts/e2-load.mjs` | `npm run test:e2-load` (not re-run 2026-10-20) | UNPROVEN |
| E2-06 | E2 | Support matrix doc | `docs/pro-readiness/SUPPORT-MATRIX.md` | documentation only | UNPROVEN |
| E2-07 | E2 | Accessibility statement | `docs/pro-readiness/ACCESSIBILITY-STATEMENT.md` | documentation only | UNPROVEN |
| E2-08 | E2 | Playwright full suite green | `e2e/` | `D4-E2E-RESULTS.txt` 18 passed / 3 skipped (2026-10-19) | UNPROVEN |
| E2-09 | E2 | E2E × 3 consecutive stability | — | not executed | UNPROVEN |
| E2-10 | E2 | WebKit/Firefox/mobile projects executed | `playwright.config.ts` | not executed on 2026-10-20 | UNPROVEN |
| E2-11 | E2 | axe full storefront/admin scan | `scripts/d1-axe-full.mjs` | `D4-AXE-RESULTS.txt` 92 scans 0 crit (2026-10-19) | UNPROVEN |
| E2-12 | E2 | Contract item 7.3 QA gate | `docs/pro-readiness/FINAL-REPORT.md` | remains PARTIAL — E2 gaps documented | UNPROVEN |
| E3-01 | E3 | Threat model | `docs/security/THREAT-MODEL.md` | doc only | UNPROVEN |
| E3-02 | E3 | ASVS-L2 summary | `docs/security/ASVS-L2.md` | doc only | UNPROVEN |
| E3-03 | E3 | Encryption & storage narrative | `docs/security/ENCRYPTION-AND-STORAGE.md` | doc only | UNPROVEN |
| E3-04 | E3 | Admin 2FA design doc | `docs/security/ADMIN-2FA.md` | doc only; TOTP not enforced in app (F3) | UNPROVEN |
| E3-05 | E3 | npm audit script | `scripts/security-audit.mjs` | `npm run security:audit` (no 2026-10-20 log) | UNPROVEN |
| E3-06 | E3 | security.txt route | `app/security.txt/route.ts` | build route listed in `E1-BUILD-LOG.txt` (2026-10-19) | UNPROVEN |
| E3-07 | E3 | bcrypt + JWT session storage | `lib/auth/*` | week3 scripts (2026-10-19); no fresh run | UNPROVEN |
| E3-08 | E3 | IDOR / wholesale security checks | `scripts/wholesale-security-checks.ts` | `npm run test:wholesale-security` (D4 pass, stale) | UNPROVEN |
| E3-09 | E3 | Rate limit / honeypot public forms | — | partial or missing — F3 scope | UNPROVEN |
| E3-10 | E3 | CSP nonces / hardened headers | `next.config.ts` | smoke headers in `D4-SMOKE.txt` (2026-10-19) | UNPROVEN |
| E4-01 | E4 | GitHub Actions CI workflow | `.github/workflows/ci.yml` | file committed; **no CI run** (no git remote) | BLOCKED |
| E4-02 | E4 | CI lint + tsc + build | `.github/workflows/ci.yml` | blocked — no git remote | BLOCKED |
| E4-03 | E4 | CI Postgres migrate + week3 | `.github/workflows/ci.yml` | blocked — no git remote | BLOCKED |
| E4-04 | E4 | CI Docker image build | `.github/workflows/ci.yml` | blocked — no git remote | BLOCKED |
| E4-05 | E4 | Deploy script | `scripts/deploy.sh` | file present; not executed 2026-10-20 | UNPROVEN |
| E4-06 | E4 | VPS bootstrap script | `scripts/server-bootstrap.sh` | file present; not executed | UNPROVEN |
| E4-07 | E4 | Readiness probe `/api/ready` | `app/api/ready/route.ts` | `smoke:prod` hit health (2026-10-19) | UNPROVEN |
| E4-08 | E4 | Daily backup script | `scripts/backup-daily.mjs` | `npm run backup:daily` (no 2026-10-20 log) | UNPROVEN |
| E4-09 | E4 | Off-site backup stub | `scripts/backup-offsite.mjs` | dry-run stub; no live rclone proof | UNPROVEN |
| E4-10 | E4 | D2 restore drill | `scripts/d2-restore-drill.mjs` | D4 restore 22/22 (2026-10-19) | UNPROVEN |
| E4-11 | E4 | Docker package + compose prod | `Dockerfile`, `docker-compose.prod.yml` | `D3-DOCKER-BUILD.txt` FAIL ECONNRESET (2026-10-19) | UNPROVEN |
| E4-12 | E4 | VPS runbook RPO/RTO | `docs/pro-readiness/VPS-RUNBOOK.md` | documentation only | UNPROVEN |
| E4-13 | E4 | Local smoke prod | `scripts/smoke-prod.mjs` | `D4-SMOKE.txt` PASS (2026-10-19) | UNPROVEN |
| E5-01 | E5 | Catalog CSV template | `docs/templates/catalog-import.csv` | file present | UNPROVEN |
| E5-02 | E5 | Catalog import dry-run | `scripts/catalog-import.ts` | `docs/pro-readiness/F6-IMPORT-PROOF.txt` — 10/10 dry-run + apply (2026-10-20) | PROVEN |
| E5-03 | E5 | Demo purge tooling | `scripts/purge-demo.ts` | `docs/pro-readiness/F6-PURGE-PROOF.txt` dry-run counts (2026-10-20) | PROVEN |
| E5-04 | E5 | Legal markdown stubs AR/EN | `content/legal/*.md` | files present; placeholders | UNPROVEN |
| E5-05 | E5 | Placeholder build gate script | `scripts/check-placeholder.mjs` | `F6-PLACEHOLDER-PROOF.txt` + wired in `npm run build` (2026-10-20) | PROVEN |
| E5-06 | E5 | SEO validate script | `scripts/seo-validate.mjs` | `docs/pro-readiness/F6-SEO-PROOF.txt` BASE `:3001` (2026-10-20) | PROVEN |
| E5-07 | E5 | E5 content report | `docs/pro-readiness/E5-CONTENT-REPORT.md` | report only | UNPROVEN |
| E5-08 | E5 | Owner assets checklist | `docs/pro-readiness/OWNER-ASSETS.md` | documentation | UNPROVEN |
| E6-01 | E6 | Handover architecture | `docs/handover/ARCHITECTURE.md` | documentation | UNPROVEN |
| E6-02 | E6 | ENV reference | `docs/handover/ENV-REFERENCE.md` | documentation | UNPROVEN |
| E6-03 | E6 | Delivery vs contract matrix | `docs/handover/DELIVERY-VS-CONTRACT.md` | documentation | UNPROVEN |
| E6-04 | E6 | UAT plan | `docs/handover/UAT-PLAN.md` | documentation; UAT not signed | UNPROVEN |
| E6-05 | E6 | Go-live checklist | `docs/handover/GO-LIVE-CHECKLIST.md` | documentation | UNPROVEN |
| E6-06 | E6 | Hypercare plan | `docs/handover/HYPERCARE-PLAN.md` | documentation | UNPROVEN |
| E6-07 | E6 | Admin guide AR | `docs/handover/ADMIN-GUIDE-AR.md` | documentation | UNPROVEN |
| E6-08 | E6 | Trader guide AR | `docs/handover/TRADER-GUIDE-AR.md` | documentation | UNPROVEN |
| E6-09 | E6 | Runbooks set | `docs/handover/RUNBOOKS/` | documentation | UNPROVEN |
| E6-10 | E6 | Handover test report | `docs/handover/TEST-REPORT.md` | documentation | UNPROVEN |
| F0-01 | F0 | ROUND-F verification matrix | `docs/pro-readiness/ROUND-F-VERIFICATION.md` | this file (2026-10-20) | PROVEN |
| F0-02 | F0 | Auto regen counts script | `scripts/regen-final-report-counts.mjs` | `npm run report:counts` (2026-10-20) | PROVEN |
| F0-03 | F0 | COUNTS.json artifact | `docs/pro-readiness/COUNTS.json` | emitted by `report:counts` (2026-10-20) | PROVEN |
| F0-04 | F0 | FINAL-REPORT generated counts block | `docs/pro-readiness/FINAL-REPORT.md` | `<!-- COUNTS:BEGIN -->` section (2026-10-20) | PROVEN |
| F1-01 | F1 | CI Playwright all projects ×3 | `.github/workflows/ci.yml`, `playwright.config.ts`, `scripts/ci-caddy-smoke.sh` (orchestration) | workflow prepared — **no CI run** (no git remote) | BLOCKED |
| F1-02 | F1 | CI Lighthouse median gate ≥0.85 | `.github/workflows/ci.yml`, `scripts/e1-lh-budget.mjs`, artifact `LIGHTHOUSE.json` | workflow prepared (LH step `continue-on-error` until F2) — no git remote | BLOCKED |
| F1-03 | F1 | CI Caddy TLS smoke | `.github/workflows/ci.yml`, `scripts/ci-caddy-smoke.sh`, `docker-compose.ci-caddy.yml`, `deploy/Caddyfile.ci` | workflow prepared — no git remote | BLOCKED |
| F1-04 | F1 | CI Docker build on Ubuntu | `.github/workflows/ci.yml`, `Dockerfile` | workflow prepared — no git remote | BLOCKED |
| F1-05 | F1 | CI audit fail on high/critical | `.github/workflows/ci.yml`, `scripts/security-audit.mjs` | workflow prepared — no git remote | BLOCKED |
| F1-06 | F1 | Private GitHub push guide | `docs/pro-readiness/GITHUB-PRIVATE-PUSH.md` | workflow prepared — push blocked (no git remote) | BLOCKED |
| F2-01 | F2 | Storefront LH ≥0.85 on Linux CI | `.github/workflows/ci.yml` LH gate | no git remote → no Linux CI numbers | BLOCKED |
| F2-02 | F2 | Lazy catalog hover on pointerenter | `components/storefront/catalog/catalog-card-hover-image.tsx` | code on master (`9edd79d`) | PROVEN |
| F2-03 | F2 | LCP hero preload / fetchPriority | `components/brand/hero-lcp-preload.tsx` | code on master (`9edd79d`) | PROVEN |
| F2-04 | F2 | Tag revalidation after admin mutations | `lib/cache/revalidate-storefront.ts` | `npm run test:f2-home-cache` | PROVEN |
| F2-05 | F2 | Product LH variance root-cause doc | `docs/pro-readiness/E1-PERF-REPORT.md` | Windows LH informational; Linux CI BLOCKED | UNPROVEN |
| F3-01 | F3 | Mandatory admin TOTP 2FA | `lib/auth/totp.ts`, migration `20261020_f3_admin_2fa_audit` | `npm run test:f3-2fa` | PROVEN |
| F3-02 | F3 | CSP nonces in middleware | `middleware.ts` `applyCspNonce` | code + `x-nonce` header | PROVEN |
| F3-03 | F3 | Upload re-encode + block active SVG | `lib/catalog/images.ts` | `npm run test:f3-upload` | PROVEN |
| F3-04 | F3 | Next.js 15.x patched + sharp upgrade | `package.json` next@15.5.28 | lockfile after install | PROVEN |
| F3-05 | F3 | CycloneDX SBOM in CI | `scripts/generate-sbom.mjs` | local sbom OK; CI run BLOCKED (no remote) | BLOCKED |
| F3-06 | F3 | Build fails on bad SITE_URL / security email | `scripts/check-site-env.mjs` | REQUIRE_SITE_ENV=1 rejects `.local` | PROVEN |
| F4-01 | F4 | age + rclone offsite with MinIO proof | `scripts/f4-backup-drill.mjs` | `npm run test:f4-backup-drill` | PROVEN |
| F4-02 | F4 | Staging compose profile | `docs/pro-readiness/STAGING-PROFILE.md` | docs on master (`1cf71bb`) | PROVEN |
| F4-03 | F4 | ALERT-RULES + monitoring doc | `docs/pro-readiness/ALERT-RULES.md` | `npm run test:f4-alerts` | PROVEN |
| F4-04 | F4 | smoke:prod via Caddy tls internal | `scripts/ci-caddy-smoke.sh` | prepared for CI; live run BLOCKED without remote | BLOCKED |
| F5-01 | F5 | Server Action contract tests | `scripts/f5-action-contracts.ts` | `npm run test:f5-contracts` | PROVEN |
| F5-02 | F5 | lib/ coverage ≥70% | `scripts/f5-lib-coverage.mjs` | `npm run test:f5-coverage` | PROVEN |
| F5-03 | F5 | Visual regression AR/EN breakpoints | `scripts/f5-visual-compare.mjs` | local baselines; CI remote BLOCKED | BLOCKED |
| F5-04 | F5 | Load k6/autocannon p95 gate | `scripts/f5-load-gate.mjs` | needs running server | UNPROVEN |
| F5-05 | F5 | TEST-INVENTORY.md | `docs/pro-readiness/TEST-INVENTORY.md` | file present 2026-10-20 | PROVEN |
| F6-01 | F6 | Placeholder gate in `npm run build` | `scripts/check-placeholder.mjs` | `npm run check:placeholders` | PROVEN |
| F6-02 | F6 | CSV import 10 products proof | `docs/templates/catalog-import-10.csv` | `F6-IMPORT-PROOF.txt` 0→10 (2026-10-20) | PROVEN |
| F6-03 | F6 | Purge demo counts on copy DB | `scripts/purge-demo.ts` | `F6-PURGE-PROOF.txt` (2026-10-20) | PROVEN |
| F6-04 | F6 | docs-as-tests for handover links | `scripts/docs-as-tests.mjs` | `F6-DOCS-AS-TESTS.json` pass | PROVEN |
| F6-05 | F6 | Admin UI screenshot evidence | `docs/ui-planning/screenshots/final-qa/` | AR baselines present | PROVEN |
| G0-01 | G0 | Private remote push landed | `origin` → `sadeksobeg/rare-o` | `git log origin/master -1` = `665380d` (2026-10-20) | PROVEN |
| G0-02 | G0 | Workflows trigger on master + PR light | `.github/workflows/ci.yml`, `ci-light.yml` | files; full CI run blocked by billing | UNPROVEN |
| G0-03 | G0 | No secrets in tracked history scan | `scripts/g0-secrets-scan.mjs` | `G0-SECRETS-SCAN.json` pass (2026-10-20) | PROVEN |
| G0-04 | G0 | GitHub Actions green on Linux | Actions run | billing: spending limit / payments — OWNER | BLOCKED |
| G3-01 | G3 | Postgres least-privilege app role + TLS | `docs/security/POSTGRES-APP-ROLE.md`, `scripts/postgres-app-role.sql` | docs/SQL present; live PG role apply = OWNER | UNPROVEN |
| G3-02 | G3 | Admin audit log what is recorded | `lib/auth/admin-audit.ts`, `AdminAuditLog` | actions: login, recovery, totp.enabled | PROVEN |
| G3-03 | G3 | Data retention & deletion procedure | `docs/security/RETENTION.md` | doc present 2026-10-20 | PROVEN |
| G3-04 | G3 | Production seed without default accounts | `prisma/seed.ts` `ALLOW_DEFAULT_SEED` guard | code; see G3 proof script | PROVEN |
| G3-05 | G3 | npm audit zero high/critical | `npm run security:audit` | failed locally on sharp chain — CI after billing | UNPROVEN |
| G0-01 | G0 | Private remote push landed | `origin` → `sadeksobeg/rare-o` | `git log origin/master -1` = `665380d` (2026-10-20) | PROVEN |
| G0-02 | G0 | Workflows trigger on master + PR light | `.github/workflows/ci.yml`, `ci-light.yml` | files; full CI run blocked by billing | UNPROVEN |
| G0-03 | G0 | No secrets in tracked history scan | `scripts/g0-secrets-scan.mjs` | `G0-SECRETS-SCAN.json` pass (2026-10-20) | PROVEN |
| G0-04 | G0 | GitHub Actions green on Linux | Actions run | billing: spending limit / payments — OWNER | BLOCKED |
| G3-01 | G3 | Postgres least-privilege app role + TLS | `docs/security/POSTGRES-APP-ROLE.md`, `scripts/postgres-app-role.sql` | docs/SQL present; live PG role apply = OWNER | UNPROVEN |
| G3-02 | G3 | Admin audit log what is recorded | `lib/auth/admin-audit.ts`, `AdminAuditLog` | actions: login, recovery, totp.enabled | PROVEN |
| G3-03 | G3 | Data retention & deletion procedure | `docs/security/RETENTION.md` | doc present 2026-10-20 | PROVEN |
| G3-04 | G3 | Production seed without default accounts | `prisma/seed.ts` `ALLOW_DEFAULT_SEED` guard | code; see G3 proof script | PROVEN |
| G3-05 | G3 | npm audit zero high/critical | `npm run security:audit` | failed locally on sharp chain — CI after billing | UNPROVEN |
