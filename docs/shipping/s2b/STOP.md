# Checkpoint 2b FIX — STOP (shots ready; 2c starting)

**Branch:** `shipping/phase-2`  
**Deploy:** none  
**Gates:** `next build && next start` (port 3001) · overflow 0 · axe serious 0 · `document-title` **enabled** · excluded axe rules: **none**  
**Evidence:** `SEE-FIX.md`, `S2B-FIX-EVIDENCE.json`, contact sheets `s2b-contact-*.png`

## Before → After (requested)
1. LB summary `0 USD` → `يُحدَّد بعرض سعر`; `NO_METHOD` → Arabic reason; inquiry submit + admin Inquiries row  
2. `LAND`/`AIR` → `بري`/`جوي`; `(explicit)` → `وزن مُدخل`; UNVERIFIED only as admin badge  
3. Weight bidi: LTR run `20 كغ` / chip `1 × عود = 20 كغ`  
4. Flags DE (black/red/gold) + LB (red/white/cedar/green); flag in field; no raw `DE` line  
5. Searchable combobox (AR/EN + flags) on storefront + admin simulator  
6. Admin «معاينة كما يراها العميل» real MethodCards + watermark for LB/JO×3/SA/AE  
7. PDP estimator in buy box, open by default; 390 scrolled to it  
8. Mobile: one estimate (sticky); sticky top border + shadow  
9. `تضمين غير المعتمد`; AE label de-duplicated  
10. Contact sheets = full viewport **contain** (no zoom crop); gates on production server  
11. No production session minting in this round (local JWT for admin shots only)

## Local hygiene
- `shipping-calc-demo-oud` set to **draft** on local DB (owner: do the same on prod via admin — no deploy).  
- Notebook rates remain **unverified** (not approved).

## 2c
Starting trader/ops surfaces next (شحناتي / tracking / docs / notifications per Phase 2 plan). Visual quality note noted for those screens.
