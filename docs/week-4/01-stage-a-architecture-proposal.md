# Week 4 — Stage A Architecture Proposal (REFINED — AWAITING EXPLICIT APPROVAL)

**Project B:** `D:\N I G H T\rare-oud-platform`  
**Project A:** untouched  
**Status:** Architecture refinement only — **NO code / packages / schema / deploy**  
**Document purpose:** Final Stage A design gate before implementation  

---

## Binding product intent (Week 4 WhatsApp)

Primary workflow lives **entirely inside the Admin Dashboard**:

1. Admin sees WhatsApp conversations in the existing admin UI.  
2. Admin opens a conversation and reads inbound text.  
3. Admin replies with text from the dashboard (no need to open WhatsApp externally).  
4. Beside the thread, admin sees **business context** from domain records (not AI inference).  
5. Domain status comes only from RetailRequest / DealProposal / WholesaleRequest.  
6. WhatsApp text never auto-changes those lifecycles.  
7. Three Week 3 domains stay separate — **no generic Order**.  
8. WhatsApp is a communication layer with **explicit** linking.  
9. Week 3 `wa.me` handoff remains a **fallback / manual alternative**, not the primary Week 4 admin workflow.

---

## 1. System topology

```
┌─────────────────────────────────────────────────────────┐
│  Admin Browser (AR/EN · RTL/LTR)                        │
│  /admin/*  → Inbox + business context panel             │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS (admin session cookie)
                            v
┌─────────────────────────────────────────────────────────┐
│  Next.js 15 (Node 22) — web process                     │
│  - Storefront / trader / admin RSC + server actions     │
│  - Reads WhatsAppConversation / WhatsAppMessage from DB │
│  - Does NOT hold Baileys socket                         │
│  - Week 3 wa.me handoff preserved as fallback           │
│  - Enqueues outbound send intents (if kill switch on)   │
└───────────────────────────┬─────────────────────────────┘
                            │ internal authenticated channel
                            │ (localhost HTTP/IPC/DB queue — TBD on VPS)
                            v
┌─────────────────────────────────────────────────────────┐
│  WhatsApp Worker (long-running Node 22 process)         │
│  - Connection lifecycle, QR auth, reconnect             │
│  - Inbound normalize → idempotent persist               │
│  - Outbound send from authorized intents only           │
│  - Connection health writes                             │
│  - Implements WhatsAppAdapter (Baileys behind it)       │
└───────────────────────────┬─────────────────────────────┘
                            v
┌─────────────────────────────────────────────────────────┐
│  Baileys @whiskeysockets/baileys@6.7.24                 │
│  → WhatsApp Web / Multi-Device                          │
└─────────────────────────────────────────────────────────┘

Hostinger VPS (always-on) · durable disk · production DB · HTTPS domain (Stage B)
```

**Principle:** Admin pages render from **persisted DB state**, not from a live Baileys connection. The worker owns the socket.

---

## 2. WhatsApp worker boundary

### Owns
- Baileys socket lifecycle  
- QR authentication ceremony (produces ephemeral QR for admin UI via controlled channel)  
- Transient reconnect  
- Inbound event intake, normalize, dedupe, persist  
- Outbound execution of approved send intents  
- Connection health persistence  
- Auth/session directory access  

### Does not own
- Retail / Deal / Wholesale business rules or status transitions  
- Admin HTML rendering  
- Storefront / trader portals  
- Automatic creation of business records  

### Process preference
**Separate long-running worker process** from Next.js on the Hostinger VPS (systemd/PM2/Docker — exact manager TBD at deploy time).  

Fallback (only if VPS constraints force it): single persistent Node process hosting both — still not serverless.

---

## 3. Baileys adapter boundary

```
Domain / Admin UI
      ↓
WhatsAppAdapter (interface)
      ↓
BaileysWhatsAppAdapter  (Stage A transport)
WaMeHandoffHelper       (Week 3 fallback; not a live socket)
```

Application code must not import Baileys types outside the adapter/worker package.

**Pinned target:** `@whiskeysockets/baileys@6.7.24` (legacy).  
**Not used:** 7.x RC, Meta Cloud API.

Interface responsibilities (conceptual):
- `getHealth()`  
- `requestQrAuthentication()` / ephemeral QR payload for admin  
- `logout()` (controlled)  
- `sendText({ conversationId, text, adminId, clientRequestId })`  
- inbound callbacks → persistence layer  

---

## 4. Persistence model (high level)

Messaging tables are **infrastructure**, not business roots.

### `WhatsAppConversation`
- Stable app id  
- WhatsApp chat identifier  
- Customer phone (E.164 when known) / display name when available  
- unread count, lastMessageAt  
- `linkType`: `none | retail_request | deal_proposal | wholesale_request`  
- `linkId` (nullable FK-like reference to domain id)  
- timestamps  

### `WhatsAppMessage`
- app id  
- conversationId  
- `waMessageId` (unique, inbound idempotency)  
- direction: inbound | outbound  
- text body  
- WhatsApp timestamp  
- delivery/processing state (best-effort)  
- `clientRequestId` (unique, outbound idempotency)  
- safe error field  
- timestamps  

### `WhatsAppConnectionState` (or equivalent singleton row/file+DB mirror)
- health enum  
- lastConnectedAt / lastErrorSafe  
- updatedAt  

### `WhatsAppLinkAudit` (recommended)
- adminId, conversationId, previous/new link, timestamp  

**No** generic Order table.  
**No** merging of RetailRequest / DealProposal / WholesaleRequest.

Week 3 domain tables remain source of truth for status, lines, products, notes.

---

## 5. Conversation / message identity & idempotency

| Event | Idempotency key | Behavior |
|---|---|---|
| Inbound text | WhatsApp message id (`waMessageId`) | Insert-once; duplicates ignored |
| Outbound send intent | `clientRequestId` (admin action generated) | Same id → do not send twice |
| Conversation upsert | WhatsApp chat id | Create or attach; do not fork on reconnect |
| Worker restart | Replay-safe; skip already-persisted inbound ids | No duplicate DB rows / no duplicate sends |

Do **not** assume exactly-once Baileys delivery. Design for at-least-once with dedupe.

---

## 6. Session / auth storage strategy

| Rule | Requirement |
|---|---|
| Location | Durable private path on Hostinger VPS (e.g. outside web root), permissions restricted (`0700`, worker OS user only) |
| Git | Never committed (`.gitignore` + deploy hygiene) |
| Browser | Never readable |
| APIs | Never returned (including admin JSON) |
| Logs | Never log auth keys, QR private material, or session blobs |
| Backups | Encrypted/private copies treated as production secrets |
| Separation | Admin JWT/session ≠ WhatsApp auth state |

**QR auth:** authorized admin triggers “show QR”; operator scans with controlled phone; phone remains available for recovery.

**Re-auth:** manual when session invalid (AUTHENTICATION_REQUIRED). No account/number/proxy rotation.

---

## 7. Admin inbox architecture

Located under existing `/admin/*` (same admin auth as Week 2/3).

### Panels
1. **Conversation list** — unread indicator, last message preview/time  
2. **Thread** — chronological inbound/outbound text  
3. **Composer** — admin text reply (disabled if kill switch off or not CONNECTED)  
4. **Business context panel** (read from linked domain record):  
   - customer name / phone  
   - flow type (Retail / Deal / Wholesale)  
   - related record id/reference  
   - related products/items when available  
   - **current domain status** (from domain table)  
   - last domain update  
   - admin notes if the domain has them  
   - deep link to `/admin/requests|deals|wholesale/...`  
5. **Connection health** — CONNECTED / CONNECTING / DISCONNECTED / AUTHENTICATION_REQUIRED / ERROR  
6. **Link controls** — explicit link/unlink to one of the three domains  

### Rendering source
Inbox reads **DB**. Optional light polling/refresh. Not Baileys-in-browser.

### i18n
UI chrome AR/EN + RTL/LTR. Message bodies not auto-translated.

---

## 8. Business-context / linking strategy

### Explicit linking only
Admin chooses: this conversation ↔ one RetailRequest **or** one DealProposal **or** one WholesaleRequest.

### Context hydration
Given `linkType` + `linkId`, server loads the matching domain record and projects:

| Context field | Source |
|---|---|
| Customer name/phone | Domain customer/trader fields (as applicable) |
| Flow type | linkType |
| Record id/reference | Domain reference/id |
| Products/items | Domain lines / product refs / deal product |
| Status | Domain `status` field only |
| Last update | Domain `updatedAt` |
| Notes | Domain notes fields if present |
| Admin deep link | Existing admin routes |

### “Customer state”
**= domain status + domain history**, never message sentiment / AI classification.

### Forbidden automations
Inbound/outbound WhatsApp must not automatically:
- create RetailRequest / DealProposal / WholesaleRequest  
- accept/counter/close deals  
- confirm/complete wholesale  
- complete retail  
- mark payment/shipping (those domains don’t exist as payment/shipping engines anyway)

Structured in-app negotiation (`NegotiationEntry`) remains authoritative for deals; WhatsApp is parallel communication.

---

## 9. Outbound safety

### Kill switch
Env / config: `WHATSAPP_OUTBOUND_ENABLED=true|false`

| State | Inbound | Outbound |
|---|---|---|
| enabled + CONNECTED | receive/store | admin send allowed |
| disabled | receive/store if connected | **blocked**; UI shows clear “Outbound disabled” |
| disconnected | no new inbound | blocked |

- No automatic outbound messages  
- No public/trader access to transport  
- Rate limit + max text length + retry budget  
- Duplicate-send prevention via `clientRequestId`  

---

## 10. Reconnect / recovery behavior

| Situation | Behavior |
|---|---|
| Transient socket drop | Worker auto-reconnect with backoff (safe limits) |
| Auth invalid / logged out | Health → AUTHENTICATION_REQUIRED · **manual QR** |
| Worker crash/restart | Reload session from private auth storage · resume · dedupe inbound · do not resend completed outbound intents |
| Host reboot | Process manager restarts worker · same recovery |
| Corrupt session | Manual logout/clear auth dir + QR · restore from encrypted backup if available |

---

## 11. Security model

- Admin routes: existing admin session + `role: admin` (Week 3 Phase 4 hardening)  
- Inbox mutations: `requireAdminSession` server-side  
- Worker ↔ web channel: localhost/private network + shared secret / signed intents — not public internet  
- Secrets: `AUTH_SECRET`, WhatsApp auth dir, DB creds, outbound kill switch — env/host only  
- No Baileys in client bundles  
- XSS-safe rendering of message text  
- IDOR: traders never see inbox; admins only  

---

## 12. Hostinger VPS runtime requirements

| Requirement | Stage A need |
|---|---|
| Always-on VPS | **Required** |
| Node.js **22.x** | **Required** |
| Long-running Next process | **Required** |
| Long-running WhatsApp worker | **Required** (preferred separate) |
| Persistent WebSocket-capable runtime | **Required** |
| Durable private disk for WA auth | **Required** |
| Durable database storage | **Required** |
| Outbound internet to WhatsApp | **Required** |
| Serverless-only | **Not acceptable / BLOCKER** |
| Exact plan size / OS image / process manager | Confirm at provision time (see blockers) |
| HTTPS + domain | **Required before production launch** (Stage B); staging may use provisional host |

---

## 13. Backup / recovery requirements

| Asset | Requirement |
|---|---|
| Application DB | Regular backups before launch (Stage B details) |
| WhatsApp auth/session | Secret-class backup; restricted access; restore tested before relying on it |
| Message history | Included in DB backups; retention policy below |
| Restore drill | Must be verified before launch Go decision (Stage B) |

**Retention (operational policy — changeable later):**  
Keep WhatsApp conversations/messages for **90 days** initially. Document as policy; implement purge job only after Stage A/B approval of timing. Do not invent legal retention claims.

---

## 14. Stage A scope (in)

A. Persistent WhatsApp connection (Baileys 6.7.24)  
B. QR authentication  
C. Incoming conversation/message storage  
D. Admin inbox in existing dashboard  
E. Read conversations  
F. Admin text replies from dashboard  
G. Conversation ↔ RetailRequest / DealProposal / WholesaleRequest linking  
H. Business context panel (domain-sourced)  
I. Connection health/status  
J. Secure session storage  
K. Idempotency + reconnect handling  
L. Outbound kill switch `WHATSAPP_OUTBOUND_ENABLED`  
M. `wa.me` fallback preserved  

---

## 15. Explicit non-goals (Stage A)

- Media / voice / files / calls / status automation  
- AI customer classification or sentiment  
- Automatic business-status changes from WhatsApp text  
- Campaigns, broadcasts, bulk messaging  
- CRM / contact scraping / harvesting  
- Analytics beyond basic operational health  
- Meta Cloud API  
- Anti-ban, detection evasion, proxy/account rotation  
- Replacing NegotiationEntry with WhatsApp threads  
- Generic Order model  
- Payment / inventory / shipping engines  

---

## 16. Remaining TRUE blockers

Only items that still block **starting implementation** or **going live with a real connection**:

| ID | Blocker | Blocks |
|---|---|---|
| **T1** | Hostinger VPS **provisioned & accessible** (SSH, Node 22 installable, durable disk confirmed) | Safe Stage A integration against real always-on runtime |
| **T2** | Dedicated operational WhatsApp number **confirmed ready** (active; conflicting WA Web sessions cleared or acceptable) | First QR login |
| **T3** | Named **operator** available to scan QR with controlled phone/SIM | Authentication ceremony |
| **T4** | Approved **private path** on VPS for WA auth storage (+ backup location owner) | Session security design freeze |

> If the client grants an explicit **“implement on local/dev first; VPS wiring later”** waiver, T1/T4 can be deferred for coding against local durable paths — but **production connection** still requires T1–T4.

### Not true blockers (optional / later decisions)

| Item | Notes |
|---|---|
| Exact process manager (systemd vs PM2 vs Docker) | Decide at deploy; architecture supports all |
| Exact internal web↔worker protocol (DB queue vs localhost HTTP) | Implementation detail within proposal |
| Pairing-code fallback | Deferred; QR only in Stage A |
| Production domain / DNS | Stage B launch requirement |
| Production DB engine (keep SQLite vs Postgres/MySQL on VPS) | Prefer decide before launch; Stage A can proceed on chosen durable DB once host known |
| Exact 90-day purge job schedule | Policy accepted; job timing optional later |
| Media support | Out of Stage A |
| Stage B security/launch | After Stage A approval + completion |

---

## 17. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Unofficial WA Web → account restriction | Conservative admin-only text; no bulk; kill switch; honest risk acceptance |
| Baileys breaking changes | Pin 6.7.24; isolate behind adapter |
| Duplicate events | Idempotent keys; outbound clientRequestId |
| Session theft | Private disk perms; no Git/API/logs; secret backups |
| Worker down while web up | Health panel; inbound pauses; outbound blocked; storefront still up |
| Admin confuses WA chat with domain status | Context panel sourced only from domain records |
| Accidental use of wa.me as primary | Product copy: dashboard is primary; wa.me = fallback |

---

## 18. Stage A Go / No-Go checklist (pre-implementation)

Use before coding starts:

- [ ] This architecture document explicitly approved  
- [ ] Hostinger VPS availability confirmed **or** local/dev waiver documented  
- [ ] Node 22 target confirmed  
- [ ] Baileys 6.7.24 pin confirmed (no 7.x RC)  
- [ ] Separate worker preference confirmed  
- [ ] QR auth + manual re-auth confirmed  
- [ ] Admin-only outbound + kill switch confirmed  
- [ ] Text-only / no media confirmed  
- [ ] Domain separation + no auto lifecycle confirmed  
- [ ] Business context panel requirements confirmed  
- [ ] wa.me remains fallback confirmed  
- [ ] Session storage/security rules confirmed  
- [ ] 90-day retention accepted as changeable policy  
- [ ] Risk acceptance (unofficial / no ban guarantee) reaffirmed  
- [ ] True blockers T1–T4 cleared **or** explicit coding waiver issued  

Use before leaving Stage A (post-implementation — future):

- [ ] QR login works  
- [ ] Persistent session survives worker restart  
- [ ] Inbound/outbound text works in admin inbox  
- [ ] Idempotency verified  
- [ ] Linking + context panel correct  
- [ ] Kill switch blocks outbound  
- [ ] No secrets in Git/client/logs  
- [ ] Week 3 domains unchanged in lifecycle behavior  
- [ ] Stage A report written · STOP for approval  

---

## Approval ask

Please reply with one of:

1. **APPROVE Stage A architecture** as written (and state whether T1–T4 are cleared or grant a local/dev coding waiver), **or**  
2. **REQUEST CHANGES** (list edits).

Until then: **no code, no package install, no migrations, no deployment.**

---

## STOP

Architecture refined and ready for your explicit approval.  
Project A untouched.
