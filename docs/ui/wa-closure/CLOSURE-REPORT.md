# WhatsApp closure report

**Date:** 2026-11-12  
**Branch:** `wa/closure-rc1`  
**Tag:** `wa-closure-rc1` (retargeted to tip after closure deltas)  
**Owner approval:** written — execute end-to-end; single final release (no migrations)

## Workstreams

| ID | Status | One line |
|----|--------|----------|
| W-A | DONE | Merged WA-V+F1.1+F2 into `main`/`wa/closure-rc1`; provenance in `docs/ops/RELEASE-PROVENANCE.md`; prod was `chat-f2-unify-local` until §5 |
| W-B | DONE | Auth at `/var/lib/rareoud/wa-auth` (not in pg_dump); daily backup+wa-auth retention 14d; scratch restore ok (12/245/1) in 2s — `docs/ops/SCRATCH-RESTORE.json` |
| W-C | DONE | Outage/recovery + disk 80/90 in-app alerts (audit de-dupe); suppressed when `CONNECT_ON_START=false`; health/ready expose `whatsapp.state`; **no email** (no mail infra) |
| W-D | DONE | Prod media ≈0.13 MiB / 2 files; dry-run script `scripts/wa-media-retention-dryrun.mjs` (default 90d, no deletes) |
| W-E | DONE | `scripts/chat-security-checks.ts` — **25 passed** |
| W-F | DONE | Local kill-switch drill **6 passed**; prod flags read-only documented in runbook |
| W-G | SKIPPED | `TEST_PHONE` not provided — do not block |
| W-H | DONE | Contrast confirm btn; J/K LTR; context close + avatar; badge wrap; banner z-index; shots under `docs/ui/wa-closure/shots/` |
| W-I | DONE | `docs/ops/WHATSAPP-RUNBOOK.md` + this report |
| W-J | DONE | Gates below |
| §5 | DONE | Deployed `bfd34dd` — dump `rareoud-pre-wa-closure-20261112-055023.dump`; rollback `pre-wa-closure-20261112-055023` |

## Gates

| Gate | Result |
|------|--------|
| `wa-v-seed-gate` | PASS |
| `wa-v-inbox-overlay-gate` | PASS (selector updated to `.rad-th-ov`) |
| `chat-f1-checks` | 38 passed |
| `chat-f1-trader-gate` | PASS |
| `chat-f2-checks` | 47 passed |
| `chat-security-checks` | 25 passed |
| `chat-killswitch-drill` | 6 passed |
| `tsc --noEmit` | PASS |
| `next lint` (touched) | PASS |

## Screenshots (honest SEE)

See `docs/ui/wa-closure/shots/SEE.md`.

## Owner decisions still open

1. **Enable `WHATSAPP_CONNECT_ON_START=true`** only after 24–48 h stability with CONNECT=false (owner decides).
2. **Retention:** propose originals kept **90 days**; dry-run only — owner must approve any real delete.
3. **Disk:** volume at ~77% on check — alerts fire at 80/90; consider pruning old pre-* dumps when ready.
4. **Email alerts:** not available until mail infra exists.
5. **TEST_PHONE** read-only sim still waiting on owner number.
6. **WA-V self-test** (mic/images/voice after connect) still owed by owner.

## Out of scope (unchanged)

Cloud API migration, virtualized lists, shortcut set, categorized templates, desktop notifications, typing indicator, forward, Lighthouse, unique `traderId` index, new product features.

## Deploy (§5)

| Field | Value |
|-------|--------|
| SHA / `DEPLOY_SHA` | `bfd34ddf8fdf34120523d526c1b2ba71debc8d58` |
| Tag | `wa-closure-rc1` |
| Dump | `/var/lib/rareoud/backups/rareoud-pre-wa-closure-20261112-055023.dump` |
| Rollback | `rare-oud-web:pre-wa-closure-20261112-055023` |
| Migrations | none |
| CONNECT | `false` (web+worker) |
| health | 200 + `whatsapp.state=disconnected` |
| PP | once; `microphone=(self)` |
| Quick replies | 8 |
| `/trader/messages` | 307 |
| dry-run | `mergesNeeded=0` |
| Logs ~5 min | clean |
| Prod shots | `shots/prod-inbox-1440-after-closure.png`, `shots/prod-inbox-390-after-closure.png` |

## READY FOR OWNER TESTS

Owner next: personal WA-V connect test (mic/images/voice); optional `TEST_PHONE` sim; decide when to set `CONNECT_ON_START=true` after 24–48h.
