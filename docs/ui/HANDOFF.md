# RARE OUD UI — Handoff (admin + trader)

Branch: `ui/pilot-world-class`. Visual authority: `docs/ui/PILOT-DIRECTION.md` + `docs/ui-planning/VISION.md`. Business boundaries stay in `docs/ui-planning/plan/PLAN.md`.

## Token system

- Hex lives in `styles/tokens.css` only.
- Portal bridge: `[data-portal="admin"|"trader"]` maps `--ro-*` → `--rad-*` (surfaces, text, status, radius).
- One radius scale via `--rad-r*`. No lavender page backgrounds; status colours (`--ok/--warn/--danger` / rad equivalents) never as decoration.
- Themes: `data-theme="dark"|"light"` on `.ro-portal`. Dark-luxury default for admin/trader/login.

## Shared components

- Prefer `components/ui-kit/*` (`Field`, `Select`, `Input`, `Textarea`, `Modal`, `Pill`, `Button`) over native `<select>` / `<dialog>` / cream `components/ui/*`.
- Shells: admin `components/admin/rad/*` + `styles/admin-dashboard.css` / `admin-inbox.css`; trader `components/trader/shell.tsx` + `styles/ui-kit.css` (`.rad-tpage`, `.rad-tabbar`).
- Formatters: `lib/i18n/admin-format.ts` (Latin digits, 24h, money). Status map: `lib/ui/status-tone.ts` + `pill-tone.ts`.
- Nav: `PendingNavLink` defaults `prefetch={false}` (sidebar/tabbar must not prefetch every route).

## Gates (how to run)

Against a running server (`PLAYWRIGHT_BASE_URL`, default `:3000` dev or `:3001` prod):

| Gate | Script |
|------|--------|
| axe / lavender / pixel / SyntaxError | `node scripts/pilot-r71-gates.mjs` |
| raw-enum / modal-scrim / phone-dir / input-bg | `scripts/pilot-r6-*-gate.mjs` |
| Lighthouse (prod, no rebuild) | start server → `node scripts/pilot-final-lighthouse.mjs` |
| Final 12 shots | `node scripts/pilot-final-shots.mjs` |

Self-test: `/dev/gate-self-test` (dev only; must 404 in production).

## Production server

`output: "standalone"`. Do **not** use `next start` alone:

```powershell
Copy-Item -Recurse -Force .next\static .next\standalone\.next\static
Copy-Item -Recurse -Force public .next\standalone\public
$env:PORT='3001'; node .next\standalone\server.js
```

Favicon: `public/favicon.ico` + `app/icon.png` + `metadata.icons`. Do **not** restore `app/favicon.ico` (Next 15 invariant during build).

## Rules learned

1. Token bridge first — never hardcode lavender/purple page fills.
2. No native selects/dialogs/file chrome except real file upload.
3. No gradients on primary buttons.
4. Mobile pages need bottom padding = tabbar (68) + safe-area + 16 so submits clear the bar.
5. Arabic: logical props only; no letter-spacing on Arabic; phones in `<bdi dir="ltr">`.
6. Decorative fonts (`Amiri` / `Cormorant`) use `preload: false`; UI fonts preload.
7. WhatsApp flags stay false; never open `.env` in tooling that prints secrets; no worker; no push/deploy without owner OK.
