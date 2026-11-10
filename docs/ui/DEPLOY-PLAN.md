# Deploy plan — `ui/pilot-world-class` → staging first

**Owner status (2026-11-10):**
- **(a) Approved:** push branch + open PR to `master` (no merge, no force-push).
- **(b) Not approved yet:** staging cutover.
- **(c) Not approved yet:** production.

Do **not** cut over staging or production until the owner writes explicit approval in chat.

## 0. Preconditions

- [x] Post-approval fixes: cream logo, trader notifications grouping, `/dev` 404 + gate-self-test.
- [x] Branch `ui/pilot-world-class` pushed + PR opened (step a).
- [ ] WhatsApp stays off on every host: `WHATSAPP_OUTBOUND_ENABLED=false`, `WHATSAPP_CONNECT_ON_START=false`.
- [ ] No `.env` secrets in git. Never open/print production secrets in chat.
- [ ] Staging test clutter cleaned on the **staging DB only** (see §3.2): products `reg-draft*`, offers `reg-gate*`, prices labeled `10 TEST`. **Never** clean production for this.

## 1. Merge steps (git)

1. Ensure branch builds: `npx tsc --noEmit` · `npx next build`.
2. PR: `ui/pilot-world-class` → `master`. **No force-push. No merge from the agent.**
3. After owner + CI approve, merge with a normal merge commit (or squash if the owner prefers).
4. Tag optional after merge: `ui-pilot-staging-YYYYMMDD`.

## 2. Build + standalone artifact

```powershell
$env:NODE_OPTIONS='--max-old-space-size=8192'
npx next build
Copy-Item -Recurse -Force .next\static .next\standalone\.next\static
Copy-Item -Recurse -Force public .next\standalone\public
$env:PORT='3001'   # staging port
$env:HOSTNAME='0.0.0.0'
node .next\standalone\server.js
```

**Never** delete `.next` while the server is running (CSS 400 / unstyled chrome).

## 3. Before any staging cutover (required for approval of b)

### 3.1 Database backup (always, even without destructive migrations)

```bash
# On a machine that can reach Postgres — adjust conn string privately, never paste secrets into chat/PRs
pg_dump --format=custom --file="rareoud-pre-staging-$(date +%Y%m%d-%H%M).dump" "$DATABASE_URL_PROD_OR_STAGING"
```

Store the dump off-box (or VPS backup volume) and record the filename + time in the cutover notes.

### 3.2 Separate staging database (never production)

1. Create a **new** Postgres database/role for staging (separate from production).
2. Restore a **sanitized** copy of production into staging:
   - Mask / null / hash-replace **phone numbers** (customers, traders, WhatsApp peers).
   - Replace **password hashes** with known staging-only hashes (or force `mustChangePassword` for every admin/trader after restore).
   - Strip or rotate live WhatsApp session material if present — WhatsApp remains offline anyway.
3. Point staging `DATABASE_URL` only at this DB. **Production `DATABASE_URL` must never be used by the staging process.**

### 3.3 Dedicated staging accounts

| Role | Purpose |
|------|---------|
| Staging admin | Unique email + **different** password from production |
| Staging trader | Unique email + **different** password from production |

Do not reuse production passwords. Do not put passwords in the PR or this file.

### 3.4 Clean regression seed data (staging DB only)

After restore, delete or unpublish staging-only clutter:

- products matching `reg-draft*`
- offers matching `reg-gate*`
- prices / titles containing `10 TEST`
- obvious regression requests/deals that make the UI look duplicated

Confirm on staging UI that home/offers no longer show four identical cards from seed data.

### 3.5 WhatsApp flags on the **running** staging host

Do **not** trust a checked-in `.env` example. After the staging process is up, verify from the **running process environment** (systemd `Environment=`, pm2 `env`, Docker `inspect`, etc.):

- `WHATSAPP_OUTBOUND_ENABLED=false`
- `WHATSAPP_CONNECT_ON_START=false`
- No WhatsApp worker child process listening / connecting.

## 4. Staging environment checklist

| Variable | Expected |
|----------|----------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | **staging** DB only |
| `AUTH_SECRET` | staging-only secret (≥16 chars) |
| `WHATSAPP_OUTBOUND_ENABLED` | `false` (verified on running process) |
| `WHATSAPP_CONNECT_ON_START` | `false` (verified on running process) |
| `RO_PROMO_FEATURES` | as today (flag-safe) |
| `APP_TIMEZONE` | `Asia/Damascus` (or current) |

Confirm after boot:

- `GET /api/health` → 200  
- `GET /dev/gate-self-test` → **404**  
- `GET /dev/ui` → **404**

## 5. Staging smoke (desktop) + signed mobile checklist

### 5.1 Desktop smoke

| # | Check | Initials / date |
|---|--------|-----------------|
| 1 | Admin login → dashboard, cream mark on sidebar | |
| 2 | `/admin/requests` list + one detail | |
| 3 | Deal awaiting payment → «تأكيد نجاح الدفع» modal | |
| 4 | `/admin/inbox` list + thread | |
| 5 | Trader login (dark form + cream mark) | |
| 6 | Trader home 390 + new-deal no horizontal overflow | |
| 7 | Trader deal detail + wholesale surface | |
| 8 | Trader notifications: day groups + «عرض المزيد» | |
| 9 | Locale ar↔en on one admin + one trader page | |
| 10 | Light theme: admin requests + trader home | |

### 5.2 Three manual mobile flows (required before approving c; strongly recommended before b sign-off)

Complete on a real phone against **staging** only. Sign each row.

| # | Flow | Phone / OS | Initials / date | Pass? |
|---|------|------------|-----------------|-------|
| M1 | **Trader proposes a deal** (login → new deal wizard → submit) | | | |
| M2 | **Admin confirms payment** on that deal (login → deal detail → confirm payment modal → success) | | | |
| M3 | **Inbox reply on a test conversation** (admin opens a **test** thread → send a platform reply; WhatsApp outbound remains off) | | | |

Notes for M3: use a staging/test conversation only. Do not connect a real WhatsApp number.

## 6. Rollback

1. Keep previous standalone bundle + `public` under `releases/YYYYMMDD-HHMM/`.
2. Point process manager at the previous release; restart; `/api/health` + admin login.
3. If the staging DB was mutated badly: restore from the §3.1 `pg_dump`.
4. This UI ship expects **no destructive migrations**; if a migration ever ships later, rollback must include migrate-down or DB restore.

## 7. Lighthouse on the real staging host

```powershell
$env:PLAYWRIGHT_BASE_URL='https://<staging-host>'
$env:PW_CHANNEL='chrome'
node scripts/pilot-final-lighthouse.mjs
```

Save as `docs/ui/pilot-final/lighthouse-staging.json`. Lab scores were ~49 admin / 63 trader under throttling — **do not block launch on 85**.

## 8. Production (c) — separate written OK only

1. Fresh `pg_dump` of production before cutover.
2. Same standalone artifact steps on the production VPS.
3. WhatsApp flags remain **false** until a dedicated WhatsApp go-live approval.
4. `/dev/*` must stay 404.
5. Re-run §5.2 mobile flows only with intentional, non-destructive actions (or skip payment confirm on real money deals).

## 9. Stop points

| Gate | Action |
|------|--------|
| (a) | Push + PR — **done when PR link is reported** |
| (b) | Staging cutover — wait for owner OK after this plan + PR review + their staging prep |
| (c) | Production — wait for owner OK after signed §5.2 on staging |
