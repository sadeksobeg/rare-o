# Proposal (DO NOT APPLY) — unique index on `WhatsAppConversation.traderId`

**Status:** proposal only. No migration file applied. Owner must approve after
`PROD-OWNERSHIP-COUNTS.sql` shows zero duplicates for multi-conversation-per-traderId.

## Why

CHAT-F1 enforces **one conversation per `traderId`** at the application layer
(`ensureTraderConversation` uses `findFirst` by `traderId` and isolates on
phone conflict). A DB unique index makes the invariant durable under races /
future code paths.

## Additive SQL (PostgreSQL)

```sql
-- Run ONLY after duplicate check returns 0 rows:
--   SELECT "traderId", COUNT(*) FROM "WhatsAppConversation"
--   WHERE "traderId" IS NOT NULL
--   GROUP BY 1 HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS
  "WhatsAppConversation_traderId_unique"
  ON "WhatsAppConversation" ("traderId")
  WHERE "traderId" IS NOT NULL;
```

Partial unique index so many unlinked (`traderId IS NULL`) rows remain allowed.

## Prisma sketch (not committed)

```prisma
@@index([traderId]) // already present historically — replace/augment with:
@@unique([traderId], map: "WhatsAppConversation_traderId_unique")
// Note: Prisma unique on nullable columns treats NULLs as distinct in PG;
// prefer raw partial unique index above if Prisma version cannot express WHERE.
```

## Rollback

```sql
DROP INDEX CONCURRENTLY IF EXISTS "WhatsAppConversation_traderId_unique";
```

## Gate before apply

1. Owner confirms VPS access.
2. Run `docs/chat/PROD-OWNERSHIP-COUNTS.sql` — section C must be 0.
3. Written owner OK for this migration (separate from CHAT-F1 code ship).
