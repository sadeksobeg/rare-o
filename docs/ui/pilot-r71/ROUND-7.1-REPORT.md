# Round 7.1 — admin carry + trader blocking fixes

**Stop here for written approval.**

Constraints held: WhatsApp flags false, no `.env` edits, no worker, no push, no new server actions/schema, no data deletion; auth untouched.

## Verdict map

| Area | Result | Evidence |
|------|--------|----------|
| A1 Admin tabbar @1440 | Fixed — `display:none !important` above 900px | `tabbar-desktop-gate.json` ok; `r71-admin-profile-1440.png` / `r71-admin-traders-1440.png` |
| A2 Profile duplicate tabs/title | Removed `AdminProfileTabs`; side nav = ملف\|أمان only; AppearanceCard no repeated group label | `r71-admin-profile-1440.png` |
| A3 Forbidden rings | Brand `Rings` in `.rad-rg` motif | (carry; not in SEND 10) |
| T1 Empty home @1440 | **Render bug** — `PortalReveal` opacity 0 until IO; fixed with eager + sync in-view | `r71-trader-home-1440.png` shows content |
| T2 Lavender page bg | Solid `--rad-c0`; trader `--rad-glow: none`; atmosphere/grain killed | lavender gate ok (page bg included) |
| T3 Beige alert | Banner/status tokens | deal/home shots |
| T4 Decorative UI fonts | Trader h1–h3 / `.font-display` → `--rad-font` | home/deal headings |
| T5 Reply clip / Mode raw / dates-money | Tabbar padding; `humanizeWholesaleNote`; `formatMoney` / `formatDateTime` | `r71-trader-reply-form-390.png`, wholesale detail |
| T6 New-deal 390 overflow | Hard 2-col `.ro-picker-grid` ≤767px | `r71-trader-new-deal-390.png` |
| T7 Start-here cards | `TaskCard` 72px rows / 48px thumbs | `r71-trader-home-390.png` |

## SEND (10)

Under `docs/ui/pilot-r71/`:

1. `r71-trader-home-1440.png`
2. `r71-trader-home-390.png`
3. `r71-trader-deal-detail-1440.png`
4. `r71-trader-wholesale-detail-1440.png`
5. `r71-trader-new-deal-390.png`
6. `r71-trader-reply-form-390.png`
7. `r71-trader-login-1440.png`
8. `r71-admin-profile-1440.png`
9. `r71-admin-traders-1440.png`
10. `r71-trader-light-home-1440.png`

## Gate totals

| Gate | File | Result |
|------|------|--------|
| Self-test | `gate-self-test.json` | **selfTestPass true** |
| Lavender (page bg + tiles + pale alerts) | `lavender-contrast-gate.json` | **ok true, hits 0** |
| Pixel (css fg vs opaque self/parent) | `pixel-contrast-gate.json` | **51 checks, 0 fails** |
| Axe ar+en 390/1440 | `axe-gate.json` | **totalViolations 0** |
| SyntaxError source | `syntax-error-gate.json` | **ok true, count 0** — prior 9 were from wrong submit (locale EN `type=submit`) / flaky pageerror with empty stack; after `getByRole(دخول\|Sign in)` + settle: **0** |
| Tabbar desktop | `tabbar-desktop-gate.json` | **ok true, display none** |
| Lighthouse | `lighthouse.json` | Prod script `pilot-r71-lighthouse-prod.mjs` **failed at `next build`** with `Invariant: no direct app page entry found for /favicon.ico` (unrelated to this skin pass). Dev LH from R7 remains non-authoritative (0.37/0.28). Re-run prod LH after favicon entry is fixed. |

## T1 root cause (cited)

Home sections wrapped in `PortalReveal` started at `opacity: 0` until IntersectionObserver fired. Greeting sat outside the wrapper, so captures showed header + tall empty canvas while DOM height remained. Fixed with eager above-the-fold reveals + sync in-view check (`components/portal/reveal.tsx`, home page).

## Blind-gate fix

Lavender gate now probes page `backgroundColor` / purple gradients, `.ro-portal-icon-well` tiles, and pale alert bars — not only component fills.

## Known gaps / proposed (not faked)

- Offer card titles may still use display type as **content** previews.
- Full r6 pixel suite still flaky on theme reload; slim DOM sampler is the reported R7.1 pixel gate.
- Production Lighthouse numbers land in `lighthouse.json` when `pilot-r71-lighthouse-prod.mjs` finishes.
