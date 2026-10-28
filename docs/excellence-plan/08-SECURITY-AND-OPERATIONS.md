# Section 8 — Security, Reliability, and Operations

## Correction to a stale assumption (flagged per this mission's own instruction to surface contradictions)

This mission's brief instructs: *"Keep SQLite as the current database unless an evidence-based architectural decision is separately approved."* **The database is already PostgreSQL 16, not SQLite** — `prisma/schema.prisma` line 6: `provider = "postgresql"`; `.env`: `DATABASE_URL="postgresql://rareoud:rareoud@localhost:5440/rareoud"`; `docs/pro-readiness/FINAL-REPORT.md`: *"PostgreSQL | **Merged** (`feat/postgres-d2` → `master`)"*. This migration was already executed, tested (`D2-MIGRATION-REPORT.json`, `D2-RESTORE-DRILL.json`), and merged in a prior, already-approved round — it is not a new architectural decision being proposed now, and nothing in this plan changes it. The brief's SQLite assumption traces to the Oct 18 `AUDIT.md`, which predates the Postgres merge by two days and was already stale on several other points (see `01-TRACEABILITY-MATRIX.md` §A). Flagged here so the owner's mental model matches reality; **no action taken.**

## Prioritized security remediation plan

| # | Area | Current state (evidence) | Action | Priority | Needs owner decision? |
|---|---|---|---|---|---|
| S1 | Authentication/authorization | bcrypt + JWT (`jose`), role-scoped middleware guards, cross-role redirect to `/forbidden` (verified live, Session 2) | None | — | No |
| S2 | Trader ownership / IDOR | `test:week3` + `test:wholesale-security` assert cross-trader access is blocked (58/58, 9/9 passing) | None | — | No |
| S3 | Server-side validation | Zod schemas on every mutation path | **See S-CVE below** | High | Yes — migration timing |
| S4 | File content validation | Magic-byte checks now present (`detectMediaMagic`) | None | — | No |
| S5 | Login throttling | 5 failures / 15 min lockout, role+identity scoped | None | — | No |
| S6 | Security headers | CSP (nonce-based, Edge-safe), HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy all present and verified via live response headers this session | None | — | No |
| S7 | Sensitive error/log exposure | Not re-audited this session (no specific contradiction found requiring it) | Scheduled for **WP10** as a standard pass, not urgent | Medium | No |
| S8 | Database integrity / migration safety | Postgres with a tested restore drill; the one pending migration (oud-specs-tiers, Session 1) is additive/idempotent, reviewed before commit (`WHERE NOT EXISTS` guards, no `DROP`) | None | — | No |
| S9 | Automated backups + verified restore | `backup:daily` + `test:d2-restore` (22/22 tables + upload checksums) — PASS per `FINAL-REPORT.md` | None | — | No |
| S10 | Structured logging / health checks | `/api/health`, `/api/ready` exist (confirmed in production route list); structured-logger adoption beyond ad-hoc `console.*` not verified | Scope for **WP10** | Low-Medium | No |
| S11 | Dependency security | **`zod` high-severity DoS advisory** (GHSA-mrhx-c7xc-m3w5, CVSS 7.5), direct production dependency, fix is a 3→4 major bump touching every schema file. 9 further high-severity findings, all transitive through `lighthouse`/`puppeteer-core` (devDependencies, not shipped) | Owner authorization needed before the zod migration (blast radius = every validation schema); dev-tool bumps can proceed independently, low risk | **High** (zod) / Low (rest) | **Yes — zod only** |
| S12 | Environment/secret management | `.env.example` documents required vars; `.wa-auth/` and `backups/` correctly gitignored | None | — | No |
| S13 | Deployment, domain, SSL | Docker/Caddy package exists and proven buildable; VPS/DNS execution is owner-controlled infrastructure | **Owner action** — WP12 | — | Yes (infra access) |
| S14 | Production monitoring/recovery | `docs/pro-readiness/ALERT-RULES.md` exists (not re-read in depth this session — no contradiction found requiring it) | Review as part of WP12 | Medium | No |
| S15 | GitHub Actions CI | Blocked ~3s on every run — billing/spending limit, not a code defect | **Owner action** — fix billing | High (process) | Yes |

### S-CVE detail — the one genuinely new, high-severity finding

`zod <4.6.6` — CWE-770 (uncontrolled resource consumption), CVSS 7.5. Zod validates every mutation path including unauthenticated storefront submission (retail requests). A malicious, deliberately oversized payload against an array/record schema could exhaust server memory — a real, if not yet exploited, denial-of-service risk. The fix is `zod@4.6.7`, which `npm` flags as a semver-major (breaking) change. This is **not** a drop-in bump: zod 4 changes error-handling APIs and some schema method signatures. Scoped as its own item in the roadmap (**WP10**) with: an inventory of every file importing `zod` (grep shows `lib/validation/schemas.ts` plus service-layer call sites across retail/wholesale/deal domains), a migration pass, and a full regression re-run (`test:week3`, `test:wholesale-security`, `tsc`, `build`) before merge.

## Schema changes requiring backup/migration/rollback discipline

| Change | Trigger | Required discipline |
|---|---|---|
| None proposed by this plan | — | This plan proposes zero schema changes. The one pending migration (`20261021120000_oud_specs_tiers`, already committed in Session 1) was reviewed this session and confirmed additive/idempotent — no new backup drill required beyond the standard pre-deploy restore-drill already in `docs/pro-readiness/D2-RESTORE-DRILL.json`'s established procedure. |

## Implemented vs. operationally verified — explicit distinction

| Control | Code present | Operationally verified |
|---|---|---|
| Security headers | Yes | Yes — live `curl -i` response headers checked this session |
| Rate limiting | Yes | Code-read only; **not load-tested** this session — recommend a scripted lockout-trigger test in WP11 |
| Backup/restore | Yes | Yes — `D2-RESTORE-DRILL.json`, prior round, 22/22 tables |
| CSP | Yes | Yes — live headers confirmed |
| Health checks | Yes | Route exists and returns 200 in production build (confirmed Session 2); **not wired to any external uptime monitor** — that's an infrastructure/ops task for WP12, owner-controlled |
