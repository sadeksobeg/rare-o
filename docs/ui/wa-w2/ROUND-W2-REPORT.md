# WA-W2 — media + live controls (re-review)

Branch: `wa/w2-media-actions`  
Deploy: **not deployed** — stop for owner review

## Principle
**No dead buttons.** Every visible inbox control either works or was removed.

## Additive migration
See `MIGRATIONS.md`. Applied locally:

`20261111100000_wa_w2_inbox_actions_media` ✅ (`prisma migrate deploy`)

## Full test output (required)
```
npm run test:whatsapp-w2
[w2] media limits
[w2] magic bytes
[w2] quick reply variables
[w2] offline OK
[w2] seed conversation
[w2] phone privacy (masked DTO + audited reveal)
[w2] magic reject spoofed extension
[w2] templates
[w2] desk actions + server send gates
[w2] kill switch + media enqueue
[w2] voice convert (ffmpeg → ogg/opus)
[w2] hide-for-me
[w2] OK
```

Covers: MIME/size caps, magic-byte sniff, spoofed extension reject, template vars + CRUD, mute/archive/block **server** send gates, kill-switch media block, media+voice enqueue + idempotency, phone DTO masked until audited reveal, ffmpeg → ogg/opus, hide-for-me.

## Dockerfile change (ffmpeg)
In `Dockerfile` **runner** stage (shared by web + WhatsApp worker):

```dockerfile
# WA-W2: ffmpeg required for voice-note → ogg/opus PTT in the WhatsApp worker
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/* \
  && ffmpeg -version >/dev/null
```

Pipeline: PTT outbound → `convertVoiceNoteToOggOpus` (`lib/whatsapp/messaging/voice-convert.ts`) before Baileys `sendMedia` with `ptt: true`. Local test used host `ffmpeg` successfully.

## Security (verified in tests + code)
| Check | Behavior |
|-------|----------|
| Magic bytes | `detectWhatsAppMediaMagic` / `saveWhatsAppMediaBytes` — rejects extension-only spoofs; per-kind size caps |
| Media download | `/api/media/whatsapp/...` requires admin session; 404 if unauthed; filenames `timestamp-12hex.ext` only (`isSafeWhatsAppMediaFileName`) |
| Phone reveal | Inbox DTO returns **masked** `participantE164` + `hasPhone`; full number only from `adminRevealInboxPhoneAction` → audited `WhatsAppPhoneRevealAudit` |
| Block / archive / mute | Enforced in `enqueueOutboundText` / `enqueueOutboundMedia` and again at claim/send via `deskOutboundBlockedReason` |

## What works
Header ⋯ / contact / search · attach · preview · voice PTT · incoming media · quick replies · **emoji picker** (cursor insert) · drafts · reply-to · hide-for-me

## Not shipped (still deferred)
- Typing indicator (Baileys presence)
- Forward

## Evidence
Harness: `/dev/wa-w2-evidence`  
Shots: `docs/ui/wa-w2/shots/frame-{light,dark}-{menu,attach,preview,voice,incoming,quick,search,emoji}.png`

## Media download harden (pre-deploy condition)
Route: `app/api/media/whatsapp/[conversationId]/[file]/route.ts`
- Rejects path traversal (`..`, `/`, encoded) via `isSafeWhatsAppConversationId` + `isSafeWhatsAppMediaFileName`
- Resolves file under `storage/uploads/whatsapp/{conversationId}/` only
- `Content-Type` from **magic bytes** (`resolveWhatsAppServeContentType`); HTML/SVG/text forced to `application/octet-stream` + `attachment`
- Always sends `Content-Disposition` + `X-Content-Type-Options: nosniff` (+ CSP sandbox)
- Covered in `test:whatsapp-w2` (`[w2] download headers`)

## VPS disk (before ffmpeg image build)
Host `72.62.155.198` (`df -h` 2026-11-11):

| Mount | Size | Used | Avail | Use% |
|-------|------|------|-------|------|
| `/` (`/dev/sda1`) | 96G | 44G | **53G** | **46%** |

Docker: Images 23.58GB (reclaimable ~6.6GB), Build Cache 9.7GB.  
**Enough headroom for ffmpeg layer.** After successful deploy + rollback image confirmed: prune dangling images/cache.

## Safety
- No production deploy until explicit owner OK
- Deploy path when approved: `pg_dump` → additive migrate → build with rollback tag → owner hand-test (image, PDF, voice on phone, emoji, quick replies) on owner number only
- Voice needs HTTPS + mic permission; worker image includes ffmpeg

## Stop
Await owner visual review of shots + explicit deploy approval.
