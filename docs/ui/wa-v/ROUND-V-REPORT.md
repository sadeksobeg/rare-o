# WA-V — visual repair (overlay + layout)

**Branch:** `wa/v-overlay-layout`  
**Deploy:** **not deployed** — production stays on W2 hotfix until owner OK  
**Method change:** verify on **real** `/admin/inbox` inside AdminShell — never `/dev` harness alone.

## Root cause found (voice on production)

`curl -I https://rareoud.com/admin/inbox` returns **two** Permissions-Policy headers:

1. Next.js (W2 hotfix): `camera=(self), microphone=(self), geolocation=()`
2. nginx (`deploy/nginx-rareoud.com.conf`): `camera=(), microphone=(), geolocation=()`

Browsers intersect policies → **microphone stays denied**.  
Repo fix (not applied on VPS yet): nginx line updated to `(self)`. Until that nginx config is reloaded on the server, **browser lock → Allow will not help** if the policy header blocks the feature.

## What shipped on this branch (local)

### 1) OverlayRoot
- `components/admin/rad/inbox/overlay-root.tsx` — body host + portal helper + z-index scale
- `FixedMenu` routes through OverlayRoot with flip/shift viewport collision
- Wired in `RadInboxShell` via `InboxOverlayProvider`

### 2) Layout / gray slab
- Disabled CSS `data-tip` `::after` on thread header + composer (was the gray rectangle over ⋯)
- Context panel: `max-height:100%`, `overflow-y:auto`, `overscroll-behavior:contain`
- Quote strip `flex:none` so reply bar is not clipped by composer flex

### 3) Bubbles
- Max width **65%**; media bubbles padded lightly (`rad-bb-media`)
- Tokens `--rad-bubble-in` / `--rad-bubble-out` (theme-aware)
- Images max 320px, `object-fit: contain`, rounded stage background (no solid purple slab)
- Lone emoji → `rad-bb-emoji` (no bubble chrome, large glyph)
- Pending/sending ticks use `LoaderCircle` (no Clock≈⏸ confusion)

### 4) Toasts
- Sonner → `bottom-right` + offset 88px (clears composer); close button kept

### 5) Voice diagnosis
- `lib/whatsapp/messaging/mic-errors.ts` — NotAllowed / NotFound / policy / insecure
- Actionable Arabic/English copy in dictionaries
- **Test microphone** button in connection sheet
- nginx conf fixed in repo (pending prod reload)

### 6) Verification gate (real `/admin/inbox`)
- Script: `scripts/wa-v-inbox-overlay-gate.mjs`
- Result: **`OVERLAY-GATE.json` → ok:true**
- Checks: overflow menu dark/light in viewport; emoji dark/light in viewport; header tip slabs suppressed; thread shots @1440 + 390
- Attach skipped locally (composer media controls disabled — WA disconnected / outbound gated in local env)
- Shots: `gate-overflow-{dark,light}-1440.png`, `gate-emoji-{dark,light}-1440.png`, `gate-thread-*-1440.png`, `gate-thread-dark-390.png`

## Still open / next when owner continues
- Portal **message hover actions** fully through OverlayRoot (still absolute on bubble)
- ConfirmDialogs already use native `<dialog>` top-layer; audit any remaining non-dialog sheets
- Attach/lightbox/toast rect asserts when local worker is CONNECTED + outbound on
- **Prod:** reload nginx with updated Permissions-Policy (requires explicit deploy/ops OK) — this alone unblocks mic on rareoud.com

## Stop
No production deploy from this round. Owner: review local shots + decide nginx+web ship.
