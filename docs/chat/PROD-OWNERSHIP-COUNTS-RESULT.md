# Production ownership counts — run 2026-11-11

**Mode:** `BEGIN; SET TRANSACTION READ ONLY;` … `ROLLBACK`  
**File verified:** no INSERT/UPDATE/DELETE/DDL keywords before run.

## Scale
| Metric | Count |
|--------|------:|
| total_traders | **1** |
| total_conversations | **12** |

## (a) Traders sharing a phone
| Metric | Count |
|--------|------:|
| shared_phone_groups | **0** |
| traders_in_shared_phone_groups | **0** |

## (b) traderId vs phone/JID owner mismatch
| Metric | Count |
|--------|------:|
| conversations_traderId_phone_mismatch | **0** |
| conversations_linked_to_wrong_trader | **1** |

### Subtype of the single (b) hit (no PII)
| Metric | Count |
|--------|------:|
| linked_but_trader_phone_empty | **1** |
| linked_phone_digits_disagree | **0** |
| linked_platform_local | **1** |
| linked_wa_jid | **0** |

**Interpretation:** not cross-tenant pollution. One conversation is `platform.local` and linked to the sole trader whose **phone field is empty**, so the “digits disagree” heuristic fires. No second trader shares a phone.

### JID shape mix (no ids)
| Shape | n |
|-------|--:|
| lid | 11 |
| platform.local | 1 |

## (c) Multiple conversations per traderId
| Metric | Count |
|--------|------:|
| traders_with_multiple_conversations | **0** |
| excess_conversation_rows | **0** |

## Cleanup proposal (DO NOT RUN — wait for owner)
Only if you want the heuristic count at zero before CHAT-F1:
1. Set the one trader’s `phone` to their real E.164 (admin UI), **or**
2. Narrow the mismatch query to ignore `@platform.local` rows when measuring phone/JID ownership.

**No data migration / unlink / delete recommended for deploy.** P0 app guard still valuable going forward (currently 1 trader; risk grows when a second trader is added with a colliding phone).
