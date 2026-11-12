# Release provenance — WhatsApp closure RC1

**Tag:** `wa-closure-rc1` → `bfd34ddf8fdf34120523d526c1b2ba71debc8d58`  
**Branch tip:** `wa/closure-rc1` / `main` / `master` (same SHA)  
**Messages:** merge `bbcd7bf` (WA-V+F1.1+F2) + `bfd34dd` (closure ops/polish)

## Ancestors included

| Line | Commit | Notes |
|------|--------|-------|
| WA-V | `b391344` | inbox overlay layout |
| CHAT-F1.1 | `2b8d1d3` | trader composer / ownership / ticks |
| CHAT-F2 | `4e7a8c4` | unify + merge confirm + audit snapshots |
| Merge | `bbcd7bf` | parents `1b1f07b` + `4e7a8c4` |

## Production after §5 final release

| Field | Value |
|-------|--------|
| `DEPLOY_SHA.txt` | `bfd34ddf8fdf34120523d526c1b2ba71debc8d58` (= `wa-closure-rc1`) |
| Rollback | `rare-oud-web:pre-wa-closure-20261112-055023` |
| Prior rollbacks kept | `pre-chat-f2-…`, `pre-chat-f1-…`, `pre-wa-v-…` |

### Diff vs `wa-closure-rc1`

Production was brought to F2 via a **working-tree patch** after F1.1, not via a git checkout of `bbcd7bf`.

| Path | Host tree SHA-256 | Image `/app/…` | Local `wa-closure-rc1` |
|------|-------------------|----------------|------------------------|
| `lib/whatsapp/messaging/trader-unify.ts` | `ef98993b…084fba` | matches host | matches |
| `lib/whatsapp/messaging/linking.ts` | `5f59911d…e67a71` | matches host | matches |
| `components/admin/linked-record-panel.tsx` | `fcf01d5f…b9cccc` | **source path absent in image** (bundled into Next standalone; host tree still has patch for tooling) | matches |

**Conclusion:** Behaviour of F2 markers is on production, but provenance label ≠ git tag. The **§5 final release** rebuilds from the tagged tree (+ closure workstream commits) so `DEPLOY_SHA` becomes the real `wa-closure-rc1` commit (or a successor tagged from it).

## How to re-verify

```bash
git rev-parse wa-closure-rc1
git merge-base --is-ancestor b391344 wa-closure-rc1 && echo wa-v_ok
git merge-base --is-ancestor 2b8d1d3 wa-closure-rc1 && echo f1_ok
git merge-base --is-ancestor 4e7a8c4 wa-closure-rc1 && echo f2_ok
# on VPS after §5:
cat /srv/rareoud/DEPLOY_SHA.txt   # must equal git rev-parse of the deployed tag tip
```
