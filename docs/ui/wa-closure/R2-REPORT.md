# WhatsApp closure — R2 follow-up

**Date:** 2026-11-12  
**Deployed SHA:** `44768d8565452b81ec9872f9e956549e735cb30d`  
**Immutable tag:** `wa-closure-deployed-44768d8` (= production)  
**Prior immutable tag:** `wa-closure-deployed-bfd34dd` (first closure image)  
**Note:** `wa-closure-rc1` left untouched (still at docs tip `68ee9fd`). Tags are no longer moved.

## 1. Provenance

`git diff --stat bfd34dd..68ee9fd` → **docs/shots only** (6 files):

- `docs/ops/RELEASE-PROVENANCE.md`
- `docs/ui/wa-closure/CLOSURE-REPORT.md`
- `docs/ui/wa-closure/shots/prod-inbox-*.png` + `.SEE.txt`

No runtime/code files between those SHAs. Production now equals `wa-closure-deployed-44768d8`.

## 2. Outage alert logic (fixed)

| Case | Result |
|------|--------|
| Never connected (`lastConnectedAt` null) | no alert |
| Owner Disconnect/Logout (clears `lastConnectedAt` + marker) | no alert |
| Kill switch on | no alert |
| Was CONNECTED, down > N min | outage alert |
| Down < N min (worker restart window) | no alert |
| Reconnect after recorded outage | recovery notice |
| `CONNECT_ON_START=false` + unexpected drop | **still alerts** |

`chat-ops-alerts-checks.ts`: **11 passed**.  
Worker restart that reconnects within N minutes is treated as a short drop → **not** an outage.

## 3. Disk

| | |
|--|--|
| Before | **77%** (74G/96G) |
| After | **44%** after prune; **~55%** after R2 image build (52G/96G) |
| Freed | build cache ~24GB + old `rare-oud-web` rollback tags |
| Kept images | `prod`, `pre-wa-closure-*`, `pre-chat-f2-*`, plus new `pre-wa-r2-*` |
| Log rotation | already `max-size=10m` / `max-file=3` |
| journald | `SystemMaxUse=1G` (vacuum OK) |

## 4. Permissions

| Path | Mode |
|------|------|
| `/var/lib/rareoud/wa-auth` | **700** (files **600**) |
| `/var/lib/rareoud/backups` | **700** (files **600**) |

## 5. Screenshots

See `docs/ui/wa-closure/r2/` + `SEE.md` (five files).

## Smoke

health 200 · `whatsapp.state=disconnected` · PP once `microphone=(self)` · quick_replies=8 · trader 307 · mergesNeeded=0 · CONNECT=false

**Rollback:** `rare-oud-web:pre-wa-r2-20261112-063057`  
**Dump:** `/var/lib/rareoud/backups/rareoud-pre-wa-r2-20261112-063057.dump`

## READY FOR OWNER TESTS (R2)
