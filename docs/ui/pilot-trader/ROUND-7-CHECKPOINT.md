# Round 7 — Trader shell + login + home

**Stop here for written approval.** No Round 8 (deals) / Round 9 until the owner approves in chat.

Constraints held: WhatsApp flags untouched, no `.env` edits, no worker, no push, no schema/API contract changes, no data deletion; trader session/IDOR unchanged.

## What changed

| Area | Change |
|------|--------|
| Shell | `defaultTheme="light"` (ref `trader-home.html`); keep theme toggle |
| Nav | Desktop `.rad-tn` only ≥901px; `.rad-tabbar` only ≤900px (no 768–900 double chrome) |
| Home | Plum hero + rings + CTAs; 3 KPI cards (deals / wholesale / unread notifications); waiting list; 2 start-here cards; offer cards; recent activity |
| Chrome polish | `page-header` / `deal-card` / `task-card` / `quote-card` off `ro-portal-*` toward rad chips/rows |
| Login | Subtitle includes `auth.traderHint` (accounts provisioned by admin); WhatsApp request footer kept |
| CSS | `.rad-thero`, `.rad-tstat`, `.rad-tsh`, `.rad-tstart`, `.rad-tocard` in `styles/ui-kit.css` |

## SEND screenshots

Under `docs/ui/pilot-trader/`:

1. `r7-trader-login-dark-1440-ar.png`
2. `r7-trader-login-dark-390-ar.png`
3. `r7-trader-home-light-1440-ar.png`
4. `r7-trader-home-light-390-ar.png`
5. `r7-trader-home-dark-1440-ar.png`
6. `r7-trader-home-dark-390-ar.png`

Manifest: `r7-shots.json`. Capture script: `scripts/pilot-trader-r7-shots.mjs`.

## Checks

- `npx tsc --noEmit` — pass
- `npx next lint` on touched trader files — pass
- Probe (390 dark capture): `hero: true`, tabbar `display: grid`

## Known gaps (report only — not faked)

- Arabic plural grammar in `waitingToday` for `n=1` (“1 أمور”) remains dictionary-level.
- Offer preview images follow live catalog media (seed fixtures may look non-oud).
- Round 8 deals list/wizard/detail and Round 9 wholesale/account still pending owner OK.

## Next (after written OK)

1. Round 8 — `/trader/deals` list + new + detail vs `trader-deals.html`
2. Round 9 — wholesale / brokerage / offers / notifications / account vs remaining ui-kit refs
