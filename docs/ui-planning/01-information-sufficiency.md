# UI Planning — Stage C: Information Sufficiency Gate

**Project:** rare-oud-platform (Project B)  
**Baseline git commit:** `72a56a7`  
**Last intake update:** 2026-10-10 (UI Plan v1.0 files 00–02 received)  
**Contractual scope source (declared):** `docs/scope/cost-breakdown-scope.md` + contract  

---

## 1. New input: UI Plan v1.0 (partial)

| File | Repo path | Status |
|------|-----------|--------|
| Index + Decision Lock | `docs/ui-planning/plan/00-index.md` | **Present** (LOCKED claims) |
| Foundations | `docs/ui-planning/plan/01-foundations.md` | **Present** |
| Components | `docs/ui-planning/plan/02-components.md` | **Present** |
| Storefront pages | `docs/ui-planning/plan/03-storefront-pages.md` | **MISSING** |
| Admin pages | `docs/ui-planning/plan/04-admin-pages.md` | **MISSING** |
| Trader pages | `docs/ui-planning/plan/05-trader-pages.md` | **MISSING** |
| Cross-cutting | `docs/ui-planning/plan/06-cross-cutting.md` | **MISSING** |
| Implementation | `docs/ui-planning/plan/07-implementation.md` | **MISSING** |
| Cost breakdown scope | `docs/scope/cost-breakdown-scope.md` | **MISSING** |

**Screenshot waiver (from plan `00-index.md` §2):** owner rejects current UI visual quality as a reference; screenshots of as-built UI are **not required**. As-built report remains structural truth. → prior screenshot BLOCKER **cleared by waiver**.

**Parameters locked in plan §3 (fill prior Q16 / Q17 / Q20 gaps):**

| Parameter | Value |
|-----------|--------|
| Launch catalog | 8 products, 2 categories, 0–2 offers |
| Real photography at launch | ~25% SKUs (Material Plate covers rest) |
| Admin users | 2 |
| WhatsApp volume | ≤ 30 conversations/day |
| Admin device split | 60% desktop / 40% mobile |
| Trader priority | highest design investment per user |
| Locales | Arabic default, English; all three roles |

**Decision Lock highlights (D1–D26):** craft-led motifs; Amiri + IBM Plex Sans Arabic (replace Noto); lucide-react only new dep; `/cart` route kept, UI says “قائمة الطلب”; no payment cues; Arabic locale URLs `/` vs `/en/…`; trader mobile-first; WCAG 2.2 AA all roles; SEO package; Material Plate placeholders.

---

## 2. Prior Stage B answers — disposition update

| # | Disposition after plan 00–02 |
|---|------------------------------|
| 1–3 Screenshots | **Cleared** — waived by plan §2 |
| 4–8, 10–11, 14–15, 18–19, 22–28, 30, 34–35 | **Accepted** (aligned with Decision Lock where overlapping) |
| 9 References | **Superseded** by creative direction + motifs in plan (Aesop proposals not needed unless owner insists) |
| 12–13 Audience | **Accepted** — trader-first + weak network / mobile majority in plan §3 |
| 16–17 Content / media | **Accepted** via plan §3 defaults |
| 20 WhatsApp ops | **Accepted** via plan §3 |
| 21 / 31 Cost breakdown | **Still BLOCKER** — path declared, file absent |
| 29 Time budget | **Still GAP** — not stated in received plan files |
| 32 Pain points after screenshots | **N/A** under waiver (optional still) |
| 33 Rejected directions | **Accepted** — plan §1.3 forbidden list |

---

## 3. Dimension scores

| # | Dimension | Score | Notes |
|---|-----------|-------|--------|
| 1 | Product scope | **GAPS** | Plan Decision Lock is rich, but **contractual** `cost-breakdown-scope.md` still missing |
| 2 | Brand and identity | **COMPLETE*** | Tokens, type, motifs, logo rules in file 01; SVG still a launch deliverable (A1), accepted risk |
| 3 | Audience and devices | **COMPLETE** | Plan §3 |
| 4 | Content readiness | **COMPLETE*** | Defaults locked; real copy/photos still launch deliverables |
| 5 | Existing UI (as built) | **COMPLETE** | `00-as-built-report.md` |
| 6 | Visual evidence | **COMPLETE** | Waived per plan §2 |
| 7 | Constraints | **COMPLETE** | Libraries, a11y, SEO, performance in Decision Lock |
| 8 | References | **COMPLETE** | Direction + forbidden list replace external site list |
| 9 | Priorities | **COMPLETE** | Trader-first; P0 surfaces; phases referenced in 00 |
| 10 | Process and approvals | **GAPS** | TENEGTA + weekly client OK; **time budget (Q29) open**; plan files **03–07 missing** |

---

## 4. Overall verdict

## **NOT READY**

Plan v1.0 is **started and partially locked** (00–02), but Stage C cannot certify **READY** until:

1. **`docs/scope/cost-breakdown-scope.md`** is in the repository (or you paste/attach it).
2. **Plan files `03`–`07`** are supplied (pages + cross-cutting + implementation) — without them there is no complete screen inventory / acceptance / phase map for **GO UI PLAN** execution.
3. **Q29** — planning/implementation time budget (days), or explicit accept of a default.

---

## 5. Remaining questions only

**[BLOCKER]**

1. Place or attach **`cost-breakdown-scope.md`** (target: `docs/scope/cost-breakdown-scope.md`).  
   *Default:* cannot map contractual Cost Breakdown sections to UI without it.

2. Provide the remaining plan files from Downloads (or regenerate):  
   `03-storefront-pages.md`, `04-admin-pages.md`, `05-trader-pages.md`, `06-cross-cutting.md`, `07-implementation.md`  
   → copy into `docs/ui-planning/plan/`.

3. **Q29** — days for UI plan freeze + implementation start?  
   *Default:* 5 working days freeze review, then Phase 0 reconciliation from file 07.

**[NON-BLOCKING]**

4. Confirm Decision Lock **D1–D26** as written in `plan/00-index.md` (reply **`lock confirmed`** or list deltas).  
5. Confirm §3 launch parameters (8 products / 25% photos / ≤30 WA /day) or edit numbers.

---

## 6. Git

- Baseline: `72a56a7`  
- Prior gate commit: `033b0fd`  
- This update: plan files 00–02 under `docs/ui-planning/plan/` + this sufficiency refresh (commit after write).

**STOP** — wait for BLOCKERs 1–2 (and preferably 3). Do **not** begin implementation. After READY, wait for explicit **`GO UI PLAN`** only if you still want a *new* plan produced; if the locked plan 00–07 is the deliverable, say **`GO IMPLEMENT`** (or keep **`GO UI PLAN`** only to finish missing plan chapters).
