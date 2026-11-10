# Independent Verification Audit — Phase 1 (Security gaps)

**Mode:** read-only verification. No fixes, commits, migrations, or pushes were made.
One throwaway live-test script (`scripts/tmp-audit-phase1-live.ts`) and one throwaway
database (`rareoud_audit_throwaway`) were created during this audit and have been
deleted; see "Temporary probes created and removed" at the end of this report.

**Scope read:** `docs/ui-planning/REMAINING-PLAN.md` (Phase 1 prompt, lines 132–183),
implementer's report in `PROJECT_AUDIT.md` → "Session 6 — 2026-10-30 — REMAINING-PLAN.md
Phase 0 + Phase 1", and commits `3b19c3b`, `52f65c3`, `4df5128`, `c7ff622`, `6ea4159` on
branch `phase/01-security`.

---

## 1. Git state

- Branch `phase/01-security`, working tree clean, **up to date with `origin/phase/01-security`**
  (fast-forward identical — `git log --oneline origin/phase/01-security -5` matches local
  exactly).
- Diff scoped to exactly the 5 Phase‑1 commits (`3b19c3b~1..6ea4159`): **31 files, +1433/-37**.
  No other work is mixed into this branch beyond Phase 0 (already audited separately) and
  the Phase‑1 security work.
- Files touched include `middleware.ts`, `lib/auth/admin-session.ts`, `lib/auth/trader-session.ts`,
  `lib/auth/password-policy.ts`, `lib/auth/rate-limit.ts`, a new migration, and the new media
  route. **Flagged for review** (all reviewed below, all additive/in-scope):
  - `middleware.ts`: +46 lines, additive (adds the `mustChangePassword` edge check and
    force-password-change redirect logic alongside the pre-existing CSP/role logic). No
    existing behavior removed.
  - `prisma/schema.prisma` + the new migration: additive only (see §5).
  - No changes to the WhatsApp adapter, no `.env` changes, no changes to `design-lab/` or
    any other project.
  - `storage/uploads/.gitkeep` (new, empty) and a 5-line `.gitignore` addition
    (`storage/uploads/*` ignored, `.gitkeep` kept) — consistent with moving brokerage media
    out of `public/`.

**Verdict: clean.** No secrets, no destructive migration, no out-of-scope files.

---

## 2. Quality gate (run independently, this session)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **PASS**, 0 errors |
| `npm run lint` (`next lint`) | **PASS**, 0 errors, 4 pre-existing warnings (unrelated: `security-settings.tsx` unused var, 3× `react-hooks/exhaustive-deps` in unrelated files) |
| `npm run build` | **PASS** after clearing a stale `.next` cache — see note below |
| `npm run check:i18n` | **PASS** — 1080 string keys match AR/EN |
| `npm run test:week3` | **PASS** — 58/58 |
| `npm run test:wholesale-security` | **PASS** — 9/9 |
| `npm run test:brokerage-media-security` | **PASS** — 9/9, live HTTP against a running dev server |
| `npx prisma migrate status` | **PASS** — "Database schema is up to date!" |

**Build note (not a Phase‑1 defect):** the first `npm run build` run failed with
`TypeError: Cannot read properties of undefined (reading 'call')` while prerendering `/trader`,
pointing at `.next/server/webpack-runtime.js`. This is a stale-build-cache symptom (a second,
unrelated dev server was already running on port 3000 against the same `.next` directory —
see §4). Deleting `.next` and rebuilding from scratch **passed cleanly, all 70 routes
compiled**, confirming this was an environment artifact, not a regression introduced by Phase 1.

---

## 3. Claim verification table

| Claim (from `PROJECT_AUDIT.md` Session 6) | Status | Evidence |
|---|---|---|
| C-1: storage moved from `public/uploads/brokerage` to `storage/uploads/brokerage`, gitignored | **VERIFIED** | `public/uploads/` contains only `.gitkeep`, no `brokerage/` subdir; `.gitignore` has `storage/uploads/*` / `!storage/uploads/.gitkeep` |
| C-1: authenticated route at `app/api/media/brokerage/[requestId]/[file]/route.ts` with session+ownership check, strict filename regex, path-traversal guard, 404 never 403 | **VERIFIED** | Code review (`route.ts:11,24,32,42-46,51-53`) + live HTTP: unauthenticated → 404, wrong trader → 404, 2 path-traversal payloads (`..%2f..%2f..%2fetc%2fpasswd`, encoded-dot variants) → 404, all with security headers present even on the 404 |
| C-1: `scripts/brokerage-media-security-checks.ts`, 9/9 live HTTP pass | **VERIFIED** | Re-ran independently against a freshly started dev server: 9/9 pass, same assertions (unauthenticated/wrong-trader/traversal → 404; owner/admin → 200; private `Cache-Control`; `image/webp` content-type) |
| C-2: additive migration adds `mustChangePassword`/`passwordChangedAt` on `AdminUser` and `TraderAccount` | **VERIFIED** | Migration SQL is two `ALTER TABLE ... ADD COLUMN` statements, no drops/renames; confirmed on a from-scratch throwaway DB (§5) |
| C-2: enforced server-side via `requireAdminSession`/`requireTraderSession`, not just UI, DB-authoritative | **VERIFIED** | Code review + live test: every server action and protected page in `app/` uses the gated `requireAdminSession`/`requireTraderSession` except the two force-password-change surfaces (which correctly use the `...AllowPasswordChange` variant). A gated call throws before any mutation runs. |
| C-2: `pwv` claim invalidates sessions on other devices the moment a password changes | **PARTIALLY VERIFIED — effective but with a UX gap (see Finding M-1)** | Live two-session test: Device B's pre-change session cannot read any protected trader data after Device A changes the password (confirmed via direct inspection of the RSC payload: the page threw `Error: UNAUTHORIZED` at `trader-session.ts:121`, the pwv-mismatch check). **No protected data is served.** However, the HTTP response is `200` with a generic client-side error fallback, not a 401/redirect-to-login — see Finding M-1. |
| C-2: `/admin/force-password-change` and `/trader/force-password-change` screens, reused `ChangePasswordForm` | **VERIFIED** | Code review confirms both pages import the same `adminChangePasswordAction`/`traderChangePasswordAction` and both use `components/auth/change-password-form.tsx` |
| C-2: reset → forced screen → change → access restored → old temp password rejected (live, AR+EN) | **VERIFIED** | Live end-to-end against a running dev server with a throwaway admin and a throwaway trader account: forced redirect confirmed (307 to `/admin/force-password-change` on any other `/admin/*` GET **and** POST), password policy rejections confirmed (too short, equal to temp, equal to email — all rejected, flag remained set), successful change confirmed via DB (`mustChangePassword` cleared, `passwordChangedAt` set), access restored (`/admin/traders` → 200 afterward), and the old temp password was rejected on a fresh login attempt. |
| C-2: rate limiting extended to both change-password actions | **VERIFIED** | Live test: 5 wrong-current-password submissions to the admin change-password action triggered `LOGIN_LOCKED` on the 6th attempt, keyed by `admin-pwchange:<session.sub>` (confirmed in `lib/auth/rate-limit.ts` + `app/actions.ts:186-213`) |
| Security headers (CSP, X-Frame-Options, etc.) already complete, nothing changed | **VERIFIED** | `curl -i` on an unauthenticated 404 from the media route still carries `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` — applied globally via `middleware.ts`, independent of the route's own auth outcome |
| Quality gate results reported (tsc/lint/build/i18n/week3/wholesale-security/media-security/e2e) | **VERIFIED** | Re-ran all of them independently this session; same pass counts reported in §2 |
| Known gap: 7 leftover test-trader rows in dev DB, not fixed, disclosed | **VERIFIED, still true** | `e2e-trader-*@rareoud.test` ×4, `e2e-foreign-trader@rareoud.test`, `f5-trader-a/b@rareoud.local` — all 7 still present in the dev DB, exactly as disclosed; low impact (dev-only), not a Phase‑1 blocker |

---

## 4. Live security tests (this session, against a fresh dev server)

A second dev server instance was already running on port 3000 from a prior session
(unrelated to this audit — left over, serving a stale/broken build). This audit started
its **own** fresh instance, which bound to port 3001 (`.claude/launch.json`'s `rare-oud-dev`
config), and ran all live tests against `http://localhost:3001`. The pre-existing instance
on :3000 was left untouched (not stopped, not used for verification).

**Brokerage media (C-1):**
- Unauthenticated request → 404 ✓
- Trader B (not the request's owner) → 404 ✓
- Owning trader → 200, `image/webp`, `Cache-Control: private, max-age=3600` ✓
- Admin → 200 ✓
- Two path-traversal payloads (`..%2f` and `%2e%2e%2f` encodings) → 404 ✓
- `public/uploads/brokerage` confirmed absent (only `.gitkeep` remains under `public/uploads/`) ✓

**Forced password change, admin and trader, both roles, live:**
- A throwaway admin and throwaway trader (`mustChangePassword: true`) were created directly
  via Prisma (not through the UI, to avoid touching the real seeded admin/trader credentials
  in `.env`).
- Logged in via the real HTTP server-action protocol (raw `fetch` replicating the exact
  multipart form + `$ACTION_*` fields the browser sends — verified by inspecting the actual
  rendered login page HTML).
- Confirmed: any other `/admin/*` page, both **GET and POST**, redirects (307/308) to
  `/admin/force-password-change` while the flag is set — this is the `middleware.ts` layer,
  which runs before the server action body (defense in depth on top of the
  `requireAdminSession` throw inside the action itself).
- Password-policy rejections tested live and all rejected, flag remained set after each:
  - 6 characters (< 10) → rejected
  - new password equal to the current temp password → rejected
  - new password equal to the account email → rejected
- Rate limiting on the change-password action: 5 wrong-current-password attempts →
  6th attempt returns `LOGIN_LOCKED`.
- Successful change (fresh throwaway account): `mustChangePassword` cleared in DB,
  `passwordChangedAt` set, `/admin/traders` reachable afterward (200), and a **new login
  attempt with the old temp password was rejected** (`LOGIN_INVALID`).
- Same flow repeated for the trader role (forced change via `/trader/force-password-change`):
  succeeded, confirmed via DB.

**Other-device invalidation, tested live with two independent session cookies ("Device A" /
"Device B"):**
- Device B logged in with the trader's (then-current) real password; confirmed it could load
  `/trader/profile` (200).
- Device A then changed the password again (the voluntary "change password" action from the
  profile/security screen, not the forced one).
- Device B, still holding its old session cookie, requested `/trader/profile` again:
  **no protected trader data was returned.** Inspecting the raw RSC payload in the response
  shows the page component threw `Error: UNAUTHORIZED` from
  `lib/auth/trader-session.ts:121` (the `session.pwv !== currentPwv` check) — i.e. the
  DB-authoritative invalidation **did fire and did block the request**, exactly as designed.
  See Finding M-1 for the UX gap in how this surfaces to the client.

**Bypassing the gate by calling a protected action directly while `mustChangePassword = true`:**
- Every protected page and server action in `app/` is gated by `requireAdminSession` /
  `requireTraderSession`, which throw `MUST_CHANGE_PASSWORD` before any DB mutation when the
  flag is set (`lib/auth/admin-session.ts:133-139`, `lib/auth/trader-session.ts:103-109`) —
  confirmed by reading every one of the ~45 call sites across `app/actions.ts`,
  `app/deal-actions.ts`, `app/brokerage-actions.ts`, `app/wholesale-actions.ts`,
  `app/whatsapp-actions.ts`, `app/trader-portal-actions.ts`, and every page under
  `app/admin/(protected)/` and `app/trader/(protected)/` — all of them use the gated variant
  except the two force-password-change surfaces, which correctly use the
  `...AllowPasswordChange` variant.
- Live-confirmed at the edge layer: a raw POST to any other `/admin/*` or `/trader/*` page URL
  while forced is redirected by `middleware.ts` before the action body runs at all.
- **One exception found and confirmed live — Finding L-1** (below): the brokerage media GET
  route (`app/api/media/brokerage/[requestId]/[file]/route.ts`) uses `getAdminSession` /
  `getTraderSession` (identity + ownership only) rather than the gated
  `requireAdminSession` / `requireTraderSession`, so it does **not** check
  `mustChangePassword`. A trader or admin who is forced to change their password can still
  fetch brokerage photos via a direct media URL. This route is outside the literal scope of
  "every page and every server action" (it is neither), but it is a protected resource reachable
  while the gate is supposed to be in effect.

---

## 5. Migrations

- `20261030022547_force_password_change/migration.sql` is **purely additive**: two
  `ALTER TABLE ... ADD COLUMN` statements (`mustChangePassword BOOLEAN NOT NULL DEFAULT false`,
  `passwordChangedAt TIMESTAMP(3)` nullable) on `AdminUser` and `TraderAccount`. No drops,
  renames, or type changes.
- `npx prisma migrate status` against the dev database: **"Database schema is up to date!"**
- **Fresh-database proof (throwaway DB, created and dropped this session):**
  created `rareoud_audit_throwaway` on the same Postgres instance, ran
  `prisma migrate deploy` from zero — **all 6 migrations applied successfully** (`0_init`
  through `20261030022547_force_password_change`) — then ran `prisma/seed.ts` against it —
  **seed completed successfully** (categories, 11 products, admin, trader, demo deal,
  brokerage seed, offers/promos). Database dropped immediately after
  (`DROP DATABASE rareoud_audit_throwaway` — confirmed gone via `\l`).

---

## 6. Requirement checklist against the Phase‑1 prompt

| Requirement | Status |
|---|---|
| A. Storage moved outside `public/`, gitignored | Done |
| A. Authenticated route, admin any / trader owner only / else 404 | Done |
| A. Strict filename validation (server-generated pattern only) | Done |
| A. Headers: private cache, nosniff, inline disposition | Done |
| A. Migrate existing files/paths, update UI to new URLs, confirm old dir gone | Done |
| A. Tests: unauthenticated/other-trader/owner/admin/traversal, added to a suite | Done (`test:brokerage-media-security`, 9/9, re-verified live) |
| B. Additive migration, both models | Done |
| B. Set flag on temp-password creation and every admin reset | Done (code review: `adminCreateTraderAction` / admin trader-reset path set it; not independently re-tested per-action here beyond the live reset-and-login flow already covered) |
| B. Server-side enforcement, not bypassable via UI | Done, with the one narrow exception in Finding L-1 |
| B. Change-password screen at design-lab quality, policy as specified | Done — policy (≥10 chars, not temp, not email) verified live for all three rejection cases |
| B. Normal profile change-password uses same policy | Done (same `checkNewPassword` call, same shared component) |
| B. Tests: reset → sign in → blocked everywhere → change → restored; old temp password rejected | Done, verified live for both roles |
| C. Rate limiting on both logins and both change-password actions | Done, verified live for admin change-password; trader change-password verified by code symmetry (identical pattern, `app/deal-actions.ts:121-148`) |
| C. Security headers reported | Done — confirmed present and unchanged |
| Quality gate | Done (§2) |

---

## 7. Findings by severity

**Critical:** none.

**High:** none.

**Medium:**

- **M-1 — Other-device invalidation works at the data layer but surfaces as a generic error,
  not a sign-out.** When a session's `pwv` no longer matches the DB (password changed
  elsewhere), `requireAdminSession`/`requireTraderSession` throw a plain `Error`
  (`"UNAUTHORIZED"`). No page in `app/admin/(protected)/` or `app/trader/(protected)/` catches
  this specific error to clear the stale cookie and redirect to `/admin/login` or
  `/trader/login`. It falls through to the route-group's generic `error.tsx`
  (`components/ui/route-error.tsx`), which shows a "something went wrong" message with a
  **Retry** button and a link back to the portal home — both of which re-run the same
  gated call and throw again, so the invalidated device is stuck in a dead-end error state
  rather than being told to sign in again. No protected data is ever exposed (verified live —
  this is a UX/robustness gap, not a security hole), but it does not match the plan's
  description of the invalidated session being cleanly "signed out." Separately, the portal
  shell chrome (`components/trader/shell.tsx`, `components/admin/...` equivalent) reads the
  session via the ungated `getTraderSession`/`getAdminSessionChrome` for the header greeting,
  so the stale display name briefly renders before the inner content errors — not a data leak
  (the name was already visible in the old session), but worth knowing when deciding whether
  this is "good enough" to ship.
  - *Suggested direction (not executed — out of scope for a read-only audit):* catch
    `UNAUTHORIZED` specifically (distinct from `MUST_CHANGE_PASSWORD`) at the layout level for
    both portals, clear the session cookie, and redirect to the respective login page.

**Low:**

- **L-1 — Brokerage media route does not check `mustChangePassword`.**
  `app/api/media/brokerage/[requestId]/[file]/route.ts` calls `getAdminSession`/
  `getTraderSession` (identity + DB-authoritative ownership check) rather than
  `requireAdminSession`/`requireTraderSession` (the gated variants). A trader or admin whose
  account is forced to change its password can still successfully fetch a brokerage photo via
  a direct, previously-known media URL. Low impact — this is read-only access to a photo the
  account already has legitimate ownership/role access to, not a privilege escalation or
  cross-account leak — but it is an inconsistency with the stated goal that the forced-change
  gate covers "every page and every server action." A GET route handler is technically neither,
  so this may be intentional scoping rather than an oversight, but it was not called out in the
  implementer's report and should be either accepted explicitly or closed in a follow-up.
- **L-2 — Leftover test-trader rows in the dev database.** Already disclosed by the
  implementer (`PROJECT_AUDIT.md`, "Gap found, not fixed"); re-confirmed present: 4×
  `e2e-trader-*@rareoud.test`, `e2e-foreign-trader@rareoud.test`,
  `f5-trader-a@rareoud.local`, `f5-trader-b@rareoud.local`. Dev-DB-only, no production impact.
  Not a Phase‑1 blocker; carried forward as already tracked.

---

## 8. Temporary probes created and removed

- `scripts/tmp-audit-phase1-live.ts` — a throwaway Node/TS script that drove the real
  server-action HTTP protocol (raw `fetch`, replicating the exact multipart body a browser
  submits) against the dev server on port 3001, created two throwaway `AdminUser`/
  `TraderAccount` rows (plus one extra throwaway admin for the happy-path change test),
  and deleted all of them in a `finally` block at the end of its run. **Deleted after use**
  (confirmed: 0 rows matching `tmp-audit%` remain in the dev database; `git status` on the
  repo is clean, the file no longer exists).
- `rareoud_audit_throwaway` — a throwaway Postgres database created to prove
  `prisma migrate deploy` + `prisma/seed.ts` both succeed from zero. **Dropped after use**
  (confirmed via `psql \l`).
- The dev server this audit started (port 3001) was left running at the end of this session,
  the same way the implementer's own dev server was found already running on port 3000 when
  this audit began. Neither was stopped as part of this read-only audit; stopping dev servers
  was judged out of scope for a verification pass.

---

## 9. Overall verdict

**No Critical or High findings.** Both Phase‑1 security requirements (C-1 private media,
C-2 forced password change) are implemented correctly and match every claim in the
implementer's report, verified independently via code review, re-run automated tests, and
new live HTTP tests against a fresh server instance, plus a from-scratch migration+seed
proof on a throwaway database. The two findings (M-1 UX gap on other-device invalidation,
L-1 narrow gate gap on the media route) do not block moving to Phase 2 per the plan's own
gating rule ("لا تنتقل قبل أن يخرج التدقيق بلا Critical أو High") — they are recorded here as
follow-ups.
