# WA-W2 — additive migrations (list before apply)

Branch: `wa/w2-media-actions`  
Deploy: **not in this pass**

## Planned (additive only — no DROP / RENAME / DELETE)

### `20261111100000_wa_w2_inbox_actions_media`

**WhatsAppConversation**
- `archivedAt DateTime?`
- `mutedUntil DateTime?`
- `blockedAt DateTime?`
- `blockedByAdminId String?`

**WhatsAppMessage**
- `replyToMessageId String?` (self-FK, optional)
- `hiddenAt DateTime?` (delete-for-me / local hide)
- `isPtt Boolean @default(false)` (voice note vs file audio)

**WhatsAppQuickReplyTemplate** (new)
- `id`, `titleAr`, `titleEn`, `bodyAr`, `bodyEn`, `category String?`, `sortOrder Int`, `createdByAdminId String?`, timestamps

**WhatsAppComposerDraft** (new)
- `id`, `conversationId`, `adminId`, `body`, `replyToMessageId?`, `updatedAt`
- `@@unique([conversationId, adminId])`

**WhatsAppPhoneRevealAudit** (new)
- `id`, `conversationId`, `adminId`, `createdAt`  
  (admin-only full phone reveal trail)

## Not migrating
- Media send/receive storage columns already exist (`storageKey`, MIME, caption, …).
- Mark-unread uses existing `unreadCount`.
- Drafts may also use `localStorage` as a progressive enhancement; DB draft is source of truth across devices.
