# WA-V Round 5 — breakpoints + light ⋯ + voice nits + QR seed

**Branch:** `wa/v-overlay-layout` (no web deploy)  
**Gate:** `scripts/wa-v-inbox-overlay-gate.mjs` → see `OVERLAY-GATE.json`  
**Console:** `docs/ui/wa-v/console-gate.log` + `CONSOLE-GATE.json`

## Verdict

Round 5 closes the 1100px layout break, the light header-⋯ dim (heavy shadow), voice overflow, and empty quick replies. Deploy plan remains prepared — **not run**; waiting for owner OK.

## Fixes

1. **Breakpoints (container query on inbox page)**  
   - Content ≥1000px (≈ viewport ≥1280 with 268px sidebar): three columns  
   - Below that: two columns; context = off-canvas drawer + scrim (header user icon)  
   - &lt;768 viewport: single column (list ↔ thread)  
   - Header name/phone: `min-width:0` + ellipsis (never vertical wrap)

2. **Light header ⋯**  
   - Softened `.rad-fixed-menu` shadow in light theme (was `rgba(0,0,0,0.85)` haze)  
   - Renamed menu class to `rad-th-menu`; removed inline heavy boxShadow  
   - Gate luma Δ search/composer = 0.0 before/after open

3. **Voice bar**  
   - Short button labels; Send clamped inside composer; level meter visible; label nowrap

4. **Quick replies**  
   - `ensureDefaultQuickReplies` idempotently seeds 8 Arabic defaults by `titleAr`  
   - Script: `npx tsx scripts/wa-v-seed-quick-replies.ts` (no migration)

5. **Console**  
   - Login via evaluate value-set (no Playwright `fill()`)  
   - Remaining `caret-color` lines = Chromium automation focus inject; `realErrorCount=0`, no Issue badge

## Screenshots (≤12) — what I SEE

| File | SEE |
|---|---|
| `r5-thread-dark-1280.png` | 1280 three columns; name single-line; thread usable |
| `r5-thread-dark-1366.png` | 1366 three columns intact |
| `r5-thread-dark-1100.png` | 1100 two columns only; context off-canvas; no squeeze |
| `r5-context-drawer-dark-1100.png` | Context drawer + scrim; list+thread underneath |
| `r5-thread-dark-1024.png` | 1024 two-column drawer mode |
| `r5-thread-dark-768.png` | 768 two-column; name single-line |
| `r5-overflow-light-1440.png` | Light header ⋯; cards/composer/search undimmed |
| `r5-voice-dark-1440.png` | Voice bar; Send inside; level meter; label one line |
| `r5-quick-replies-dark-1440.png` | ⚡ populated templates (ترحيب/سعر/توفر/…) |
| `r5-thread-dark-390.png` | Mobile fill; clearance above tab bar; no list peek |

## Deploy plan (PREPARED — DO NOT RUN)

UI-only, no migrations. Flags stay off.

1. `pg_dump -Fc` → `/var/lib/rareoud/backups/rareoud-pre-wa-v-<STAMP>.dump`  
2. Tag `rare-oud-web:prod` → `rare-oud-web:pre-wa-v-<STAMP>`  
3. Build/ship this branch SHA; `compose up -d web worker`  
4. Smoke: ready/health/login; inbox at 1440/1100/390 dark+light; QR list non-empty; flags `false`  
5. Rollback: retag image; restore dump only if DB touched (should not be)

**Mic on production (no deploy):** Ctrl+Shift+R → lock → Microphone → Allow.
