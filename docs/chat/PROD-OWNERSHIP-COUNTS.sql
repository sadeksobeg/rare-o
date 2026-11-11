-- CHAT-F1 — READ-ONLY production conflict counts (no PII).
-- Do NOT run until the owner confirms VPS access in chat.
-- Usage (on VPS, inside postgres container or via compose exec):
--   psql -U rareoud -d rareoud -f /path/to/PROD-OWNERSHIP-COUNTS.sql
-- Or: docker compose … exec -T postgres psql -U rareoud -d rareoud < PROD-OWNERSHIP-COUNTS.sql
--
-- Returns counts / ids only — no emails, phones, message bodies, or display names.

\echo '=== A) traders sharing a non-empty phone (normalized digits collision) ==='
-- Same digit sequence after stripping non-digits; empty phones ignored.
SELECT COUNT(*)::int AS shared_phone_groups
FROM (
  SELECT regexp_replace(phone, '[^0-9]', '', 'g') AS digits
  FROM "TraderAccount"
  WHERE phone IS NOT NULL AND length(trim(phone)) > 0
  GROUP BY 1
  HAVING COUNT(*) > 1
) g;

SELECT COUNT(*)::int AS traders_in_shared_phone_groups
FROM "TraderAccount" t
WHERE regexp_replace(COALESCE(t.phone, ''), '[^0-9]', '', 'g') <> ''
  AND regexp_replace(t.phone, '[^0-9]', '', 'g') IN (
    SELECT regexp_replace(phone, '[^0-9]', '', 'g')
    FROM "TraderAccount"
    WHERE phone IS NOT NULL AND length(trim(phone)) > 0
    GROUP BY 1
    HAVING COUNT(*) > 1
  );

\echo '=== B) conversations whose traderId differs from the trader that owns that phone/JID ==='
-- Heuristic: conversation.participantE164 (or digits of waChatId before @)
-- matches a TraderAccount phone, but conversation.traderId is set to a
-- different trader (or null while another trader owns that phone).
WITH conv AS (
  SELECT
    c.id AS conversation_id,
    c."traderId" AS linked_trader_id,
    COALESCE(
      NULLIF(regexp_replace(COALESCE(c."participantE164", ''), '[^0-9]', '', 'g'), ''),
      NULLIF(regexp_replace(split_part(c."waChatId", '@', 1), '[^0-9]', '', 'g'), '')
    ) AS digits
  FROM "WhatsAppConversation" c
),
owners AS (
  SELECT
    regexp_replace(phone, '[^0-9]', '', 'g') AS digits,
    array_agg(id ORDER BY "createdAt") AS trader_ids
  FROM "TraderAccount"
  WHERE phone IS NOT NULL AND length(trim(phone)) > 0
  GROUP BY 1
)
SELECT COUNT(*)::int AS conversations_traderId_phone_mismatch
FROM conv c
JOIN owners o ON o.digits = c.digits
WHERE c.digits IS NOT NULL
  AND (
    c.linked_trader_id IS NULL
    OR NOT (c.linked_trader_id = ANY (o.trader_ids))
    OR (
      -- linked trader exists but is not among phone owners (stale / wrong)
      c.linked_trader_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "TraderAccount" t
        WHERE t.id = c.linked_trader_id
          AND regexp_replace(COALESCE(t.phone, ''), '[^0-9]', '', 'g') = c.digits
      )
    )
  );

-- Same mismatch, but only where linked_trader_id is non-null and wrong:
SELECT COUNT(*)::int AS conversations_linked_to_wrong_trader
FROM conv c
JOIN owners o ON o.digits = c.digits
WHERE c.digits IS NOT NULL
  AND c.linked_trader_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "TraderAccount" t
    WHERE t.id = c.linked_trader_id
      AND regexp_replace(COALESCE(t.phone, ''), '[^0-9]', '', 'g') = c.digits
  );

\echo '=== C) traders with multiple WhatsAppConversation rows ==='
SELECT COUNT(*)::int AS traders_with_multiple_conversations
FROM (
  SELECT "traderId"
  FROM "WhatsAppConversation"
  WHERE "traderId" IS NOT NULL
  GROUP BY "traderId"
  HAVING COUNT(*) > 1
) m;

SELECT COALESCE(SUM(cnt - 1), 0)::int AS excess_conversation_rows
FROM (
  SELECT COUNT(*)::int AS cnt
  FROM "WhatsAppConversation"
  WHERE "traderId" IS NOT NULL
  GROUP BY "traderId"
  HAVING COUNT(*) > 1
) m;

\echo '=== D) platform-local JIDs vs phone JIDs (shape only) ==='
SELECT
  COUNT(*) FILTER (WHERE "waChatId" LIKE '%@platform.local')::int AS platform_local_threads,
  COUNT(*) FILTER (WHERE "waChatId" LIKE '%@s.whatsapp.net')::int AS whatsapp_jid_threads,
  COUNT(*)::int AS total_conversations
FROM "WhatsAppConversation";

\echo '=== DONE (read-only) ==='
