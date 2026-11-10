# Deploy plan — `ui/pilot-world-class` → staging first

**Status:** plan only. Do **not** push or deploy until the owner writes explicit approval in chat.

Owner decision (2026-11-10): visual UI approved; staging before production.

## 0. Preconditions

- [ ] Three post-approval fixes merged locally (cream logo, trader notifications grouping, `/dev` 404 + gate-self-test).
- [ ] Local commits on `ui/pilot-world-class` reviewed.
- [ ] WhatsApp stays off: `WHATSAPP_OUTBOUND_ENABLED=false`, `WHATSAPP_CONNECT_ON_START=false`.
- [ ] No `.env` secrets in git. Never open/print production secrets in chat.
- [ ] Clean test/seed clutter before staging smoke: products `reg-draft*`, offers `reg-gate*`, prices labeled `10 TEST`, obvious regression requests — **owner or ops**, not automatic destructive scripts without OK.

## 1. Merge steps (git)

1. Ensure branch is clean and builds: `npx tsc --noEmit` · `npx next build`.
2. Open PR: `ui/pilot-world-class` → `master` (or agreed release branch). **No force-push.**
3. After PR approval + CI green, merge with a normal merge commit (or squash if team prefers — ask owner).
4. Tag optional: `ui-pilot-staging-YYYYMMDD`.

Do **not** push from this agent session without a separate written OK.

## 2. Build + standalone artifact

On the build machine / CI:

```powershell
$env:NODE_OPTIONS='--max-old-space-size=8192'
npx next build
# Required — next start alone is wrong for output: "standalone"
Copy-Item -Recurse -Force .next\static .next\standalone\.next\static
Copy-Item -Recurse -Force public .next\standalone\public
```

Run:

```powershell
$env:PORT='3001'   # or staging port
$env:HOSTNAME='0.0.0.0'
node .next\standalone\server.js
```

**Never** delete `.next` while the server is running (CSS 400 / unstyled chrome).

## 3. Environment checklist (staging)

| Variable | Expected |
|----------|----------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | staging DB (not prod) |
| `AUTH_SECRET` | staging secret (≥16 chars) |
| `WHATSAPP_OUTBOUND_ENABLED` | `false` |
| `WHATSAPP_CONNECT_ON_START` | `false` |
| `RO_PROMO_FEATURES` | as today (flag-safe) |
| `APP_TIMEZONE` | `Asia/Damascus` (or current) |

Confirm after boot:

- `GET /api/health` → 200  
- `GET /dev/gate-self-test` → **404**  
- `GET /dev/ui` → **404**  
- No WhatsApp worker process started.

## 4. Staging smoke list

Log in with staging admin / trader accounts (not production passwords in chat).

| # | Check |
|---|--------|
| 1 | Admin login → dashboard (dark), cream mark visible on sidebar |
| 2 | `/admin/requests` list + open one detail |
| 3 | `/admin/deals/[awaiting_payment]` → open «تأكيد نجاح الدفع» modal |
| 4 | `/admin/inbox` list + thread |
| 5 | Trader login (dark form + cream mark) |
| 6 | Trader home 390: tabs clear, no horizontal overflow on new-deal |
| 7 | Trader deal detail + wholesale request surface |
| 8 | Trader notifications: day groups, collapsed duplicates, «عرض المزيد» |
| 9 | Locale toggle ar↔en on one admin + one trader page |
| 10 | Light theme smoke on admin requests + trader home |

## 5. Rollback

1. Keep previous standalone bundle + `public` tarball on the VPS (`releases/YYYYMMDD-HHMM/`).
2. Point process manager (systemd/pm2/docker) at previous release directory.
3. Restart; confirm `/api/health` and admin login.
4. DB: this UI branch is **additive / no destructive migrations** — if a migration ever ships later, rollback plan must include migrate-down or restore from backup (out of scope for this UI plan).

## 6. Lighthouse on the real server

After staging is up on the VPS (public or VPN URL):

```powershell
$env:PLAYWRIGHT_BASE_URL='https://staging.example'  # real host
$env:PW_CHANNEL='chrome'
node scripts/pilot-final-lighthouse.mjs
```

Record scores in `docs/ui/pilot-final/lighthouse-staging.json`. Lab desktop under throttling was ~49/63; expect better with compression/CDN — **do not block launch on 85**.

## 7. Production (later — separate written OK)

Only after staging smoke + owner OK:

1. Same artifact steps against production host / rareoud.com VPS.
2. WhatsApp flags remain **false** until a dedicated WhatsApp go-live approval.
3. `/dev/*` must stay 404.
4. Re-run smoke list on production with read-only caution (no payment confirm on real deals unless intentional).

## 8. Stop

This document is the plan. **No push. No deploy.** Await owner approval for: (a) push/PR, (b) staging cutover, (c) later production.
