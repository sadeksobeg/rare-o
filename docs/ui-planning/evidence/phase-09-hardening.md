# Phase 9 — Hardening (MASTER ≈ REMAINING phase 7)

Branch: `phase/09-hardening`. SEO, a11y, security, backups, cleanup evidence.
No WhatsApp production pairing; no destructive migrations.

## Quality gate

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run check:i18n` | PASS — 1217 keys; ternaries **53** (baseline lowered 55→53) |
| `npm run seo:validate` | PASS (robots + sitemap + hreflang signals) |
| `npm run test:d1-axe` | PASS — **92 scans, 0 failed** → `docs/pro-readiness/AXE-RESULTS.json` |
| `npm run test:wholesale-security` | PASS |
| `npm run test:f5-security` | PASS (6; XSS HTML skip without BASE) |
| `npm run test:brokerage-media-security` | PASS (12) |
| `npm run test:session-invalidation` | PASS (11) |
| `npm run backup:daily` | PASS → `backups/daily-2026-10-31T10-57-10` |
| `npm run test:d2-restore` | PASS — 27/27 tables match (`D2-RESTORE-DRILL.json`) |
| `npm run test:f4-backup-drill` | PARTIAL — local pack/encrypt OK; MinIO upload failed (image pull denied) |
| `npm run security:audit` | FAIL gate (expected) — see High findings below |
| Headers on `/` | `X-Frame-Options: DENY`; CSP present with nonce |

## SEO work this phase

- `organizationJsonLd` + `websiteJsonLd` on home
- `breadcrumbJsonLd` on PDP
- `withDefaultOgImage` for home + catalog (instrument atelier photo)
- Existing: sitemap, robots, product JSON-LD, canonical + hreflang via `storefrontMetadata`

## npm audit (high+)

Reported by `security:audit` (11 high among 27 total). Notable:

1. **zod** (transitive under `chromium-bidi` / puppeteer tooling) — GHSA memory exhaustion; **plan:** keep direct app `zod` current; LH/puppeteer chain is dev-only — do not `audit fix --force` (breaks puppeteer). Track with excellence-plan B4 allowlist.
2. **eslint / minimatch** tree (dev) — upgrade eslint-config-next when Next train allows; not production runtime.
3. Other highs in the same eslint/typescript-eslint graph — same plan.

No production WhatsApp adapter secrets introduced.

## Backups

- Daily dump + uploads copy succeeded locally.
- **Restore drill (D2)** succeeded against throwaway Postgres container.
- Offsite MinIO drill (F4) blocked by Docker Hub image pull for `minio/mc` in this environment — document as infra gap, not app regression. Runbook: `docs/handover/RUNBOOKS/backup-restore.md`.

## Cleanup / i18n

- Migrated several new `locale === "ar" ?` sites to `localizedName` / `dict.admin.team`.
- Ratchet baseline **55 → 53**.

## Cross-browser

Not re-executed on physical Safari/Samsung this pass. Prior pro-readiness rounds remain the reference; Phase 10 walkthrough should include device smoke.

## Out of scope (explicit)

- WhatsApp QR / live send / kill-switch lift
- Destructive Prisma migrations
- Raising Lighthouse mobile budgets in CI this pass (axe suite covered a11y; LH budget scripts exist: `test:d1-lh`, `test:lh-budget`)

## REVIEW-LOG

**Pass 1:** Closed SEO JSON-LD/OG gaps; ran security + restore suite.
**Pass 2:** Fixed i18n ratchet growth from phases 6–8; axe full matrix green.
