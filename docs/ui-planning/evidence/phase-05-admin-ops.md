# Phase 5 — Admin operations

Branch: `phase/05-admin-ops`. Screens OPS-01 … OPS-04 (MASTER-BUILD-PLAN Part C3).
Not in design-lab — built against VISION.md 5.3–5.4 on the real app.

## Quality gate

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npx next lint` on touched files | PASS |

Self-review / world-class references / videos: brief notes in REVIEW-LOG appendix below; full screenshot suite not recorded this pass.

## Screen status

| ID | Route | Status | Notes |
|---|---|---|---|
| OPS-01 | `/admin/inbox` | Done (polish) | Resizable list↔thread (localStorage widths); resizable thread↔context on xl; quick-reply chips; keyboard inset kept; tabs/search/unread already present. **Brokerage link type still not in allowlist** (`link-constants.ts` + Prisma comment) — reported, not invented. Label key `typeBrokerage` ready if added later. **No Baileys adapter changes.** |
| OPS-02 | `/admin/requests` | Done (polish) | `?view=kanban` board with drag → confirm → `adminTransitionRetailRequestAction` (valid transitions only). Table/cards unchanged. Detail already had stepper, handoff, linked WA. |
| OPS-03 | `/admin/deals` | Done (polish) | Waiting chip already on list; detail now shows waiting badge + linked conversation link. Negotiation thread reused. |
| OPS-04 | `/admin/wholesale/[id]` | Done (polish) | Shipping tracker steps from real status + `shippedAt` / carrier / tracking. Lines + quote controls unchanged (no invented math). |

## Missing data sources (report only)

1. WhatsApp ↔ brokerage primary link (`brokerage_request`) — not in `WHATSAPP_ACTIVE_LINK_TYPES`. Minimal additive change: extend allowlist + `assertLinkTargetExists` + picker UI. Out of scope without owner OK (touches linking contract).
2. Saved reply templates as DB entities — Phase 5 ships three dictionary quick replies, not a managed template store.
3. Bulk actions / density / column chooser on retail lists — deferred; Kanban + existing URL filters cover the primary ops path.

## REVIEW-LOG (Phase 5 self-review)

**Pass 1:** Confirmed inbox already had three-pane intent (list | thread | context) but fixed widths; added drag handles. Verified retail transitions match `RETAIL_REQUEST_TRANSITIONS` before wiring Kanban drop. Wholesale tracker mapped to real statuses (`quote_provided`, `confirmed`, `shippedAt`, `completed`) after an initial wrong `quoted`/`accepted` draft.

**Pass 2:** Deal detail used `entries[0]` for waiting — wrong because admin fetch is ascending; switched to last entry. Nested resizable shell on conversation page with `list=null` abandoned in favor of `InboxThreadContextSplit`.
