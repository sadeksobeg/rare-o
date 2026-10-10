# Week 4 — Phase D Report

**Project B:** `D:\N I G H T\rare-oud-platform`  
**Status:** Phase D complete — **STOPPED**; awaiting approval before Phase E  
**Policy:** Explicit linking only · one primary link · no domain merge · no auto business actions

---

## 1. What was implemented

- ONE active primary link per WhatsApp conversation → `RetailRequest` | `DealProposal` | `WholesaleRequest`
- Auditable link set / change / clear (`WhatsAppLinkAudit`)
- Business Context panel from real domain fields only
- Admin linking UI on conversation detail
- Server-side allowlisted link types (no arbitrary Prisma model names)
- AR/EN labels for linking + context
- Inbound WhatsApp still does not create/mutate business records

---

## 2. Linking architecture

```
Admin (requireAdminSession)
  → linkConversationToBusinessRecord / clearConversationBusinessLink
  → assert target exists (allowlist switch)
  → update WhatsAppConversation.linkType/linkId
  → append WhatsAppLinkAudit
  → getBusinessContextForConversation (read-only projection)
```

| Rule | Behavior |
|---|---|
| Active links | At most one (`linkType` + `linkId`) |
| Unlinked | `linkType=none`, `linkId=null` → UI “Not linked” |
| Target missing | Reject `TARGET_NOT_FOUND` |
| Unsupported type | Reject `UNSUPPORTED_LINK_TYPE` |
| Domain mutation | Never — linking only |

---

## 3. Schema / migrations

Migration: `20261005144734_week4_phase_d_whatsapp_linking` (additive)

### `WhatsAppConversation` added fields
- `linkType` (`none` \| `retail_request` \| `deal_proposal` \| `wholesale_request`)
- `linkId`, `linkedAt`, `linkedByAdminId`

### `WhatsAppLinkAudit`
- conversation, action (`set`\|`change`\|`clear`), previous/new type+id, adminId, createdAt

Week 3 domain models unchanged (no FKs into Retail/Deal/Wholesale — soft reference by id).

---

## 4. Authorization / security

| Check | Enforcement |
|---|---|
| Who may link | Admin session only (`requireAdminSession`) |
| Trader JWT | Rejected as admin |
| Link type | Server allowlist only |
| Target | Must exist in allowlisted table |
| Trader IDOR | Existing `traderId` filters unchanged for trader domain APIs |
| Browser | Never trusts client for auth or model selection |

---

## 5. Business context behavior

| Link | Shown |
|---|---|
| Retail | reference, customer name/phone, status, lines, updatedAt, admin href |
| Deal | reference, trader identity, title, dealKind, status, product, latest negotiation, admin href |
| Wholesale | reference, trader identity, status, requestMode, lines, updatedAt, admin href |
| None | “Not linked” / غير مرتبط |

Status always from domain `status` — never from message text.

---

## 6. Files changed / added

| Path | Action |
|---|---|
| `prisma/schema.prisma` | link fields + audit |
| `prisma/migrations/20261005144734_week4_phase_d_whatsapp_linking/` | migration |
| `lib/whatsapp/messaging/link-constants.ts` | allowlist |
| `lib/whatsapp/messaging/linking.ts` | link/clear/context |
| `lib/whatsapp/messaging/inbox.ts` | link summary on list/detail |
| `app/whatsapp-actions.ts` | link/unlink/context actions |
| `components/admin/business-context-panel.tsx` | context UI |
| `components/admin/inbox-link-controls.tsx` | link UI |
| `app/admin/(protected)/inbox/[id]/page.tsx` | wire panels |
| `app/admin/(protected)/inbox/page.tsx` | link hint in list |
| `lib/i18n/dictionaries.ts` | AR/EN |
| `lib/whatsapp/index.ts` | exports |
| `scripts/whatsapp-phase-d-checks.ts` | tests |
| `package.json` | `test:whatsapp-phase-d` |
| `docs/week-4/06-phase-d-report.md` | this report |

---

## 7. Tests and results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run test:whatsapp-phase-d` | PASS (46 assertions) |

Covers: link retail/deal/wholesale, change/remove, invalid target, unsupported type, trader JWT blocked, unauthorized actions, ownership filters, no auto status/create from messages, AR/EN, audits. Isolated temp DB only.

---

## 8. Known limitations / remaining work

- No multi-link (one primary only — by design)
- No phone-number auto-match to Customer/Trader
- Link UI uses record ID entry (no search picker yet)
- Soft `linkId` (no DB FK) — broken target shows as unlinked context
- Phase E+: idempotency/reconnect hardening polish, security regression pack, production readiness
- Still deferred: QR, VPS, realtime, media, AI/CRM

---

## Approval gate

**Do not start Phase E until explicit approval.**
