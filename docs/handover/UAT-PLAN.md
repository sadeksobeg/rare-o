# UAT plan — RARE OUD

**Audience:** product owner + one admin tester + one trader tester.  
**Environment:** staging with production-like env (HTTPS, real WA optional).

## Entry criteria

- [ ] Staging deployed from release tag
- [ ] `smoke:prod` PASS
- [ ] `RO_SHOW_UI_FIXTURES` unset
- [ ] Legal pages reviewed (placeholders acceptable for UAT only if flagged)

## Storefront (Arabic + English)

| ID | Scenario | Pass |
|----|----------|------|
| U-S01 | Home → catalog → product → add to cart | |
| U-S02 | Cart → request form → wa.me opens with prefilled text | |
| U-S03 | Catalog search + category filter URL | |
| U-S04 | `/en/catalog` locale + RTL/LTR layout | |
| U-S05 | Privacy / terms / cookies TOC links | |
| U-S06 | Contact WhatsApp CTA | |

## Admin

| ID | Scenario | Pass |
|----|----------|------|
| U-A01 | Login / logout | |
| U-A02 | Publish product + appears on catalog | |
| U-A03 | Request status transition + audit | |
| U-A04 | Accept deal with conflict warning | |
| U-A05 | Reject deal with reason → trader notification | |
| U-A06 | Wholesale tracking fields | |
| U-A07 | Inbox thread (if WA linked) | |

## Trader

| ID | Scenario | Pass |
|----|----------|------|
| U-T01 | Login | |
| U-T02 | New catalog deal wizard | |
| U-T03 | View negotiation / status | |
| U-T04 | Wholesale submit | |
| U-T05 | Redirect from public `/offers` to trader portal | |

## Exit criteria

- No S1/S2 defects open
- Owner sign-off on PARTIAL items (1.4, 2.6, 9.1) or documented acceptance
- `DELIVERY-VS-CONTRACT.md` reviewed

Sign-off: _________________ Date: _______
