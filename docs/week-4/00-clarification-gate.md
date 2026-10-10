# Week 4 — Clarification Gate (ANSWERS RECORDED)

**Status:** Answers received · Stage A architecture proposal next  
**Code / deps / schema / deploy:** still **NOT** started  
**Project A:** untouched  

Full answers captured from client message (2026-10-05). Summary:

| Topic | Decision |
|---|---|
| Library | `@whiskeysockets/baileys` **YES** · pin target **6.7.24 (legacy)** · **no install yet** · no 7.x RC without later approval |
| Node | Production **22.x** (align with local 22.14.0) |
| Auth | **QR** preferred · pairing optional later if safe · not both unless needed |
| Session | Never Git / never client / never API · durable private storage · backup like a secret |
| Reconnect | Auto reconnect for **transient** failure if safe · **manual** re-auth when session invalid |
| Hosting | Always-on persistent host **REQUIRED** · serverless **BLOCKER** · provider **UNKNOWN** |
| Worker | Prefer **separate WhatsApp worker** when host allows · final A vs B after host known |
| Domain/HTTPS | Domain UNKNOWN · HTTPS **REQUIRED** before launch |
| DB/backups | UNKNOWN provider · durable DB + session storage **REQUIRED** · backups **REQUIRED** before launch · retention **UNKNOWN** (propose, don't invent/implement) |
| Stage A scope | Text + inbox + linking + health + idempotency + secure session · **media OUT** |
| Outbound | **Admin only** · no auto lifecycle from inbound text · keep Week 3 **wa.me** handoff |
| Risk | Unofficial · no ban guarantee · no spam/bot/broadcast/anti-ban — **accepted** |

See: `docs/week-4/01-stage-a-architecture-proposal.md`
