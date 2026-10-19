# Accessibility statement (draft)

**Product:** Rare Oud platform — storefront, admin, and trader portals  
**Standard:** WCAG 2.1 Level AA (target)  
**Languages:** Arabic (RTL) and English (LTR)

## Measures

- Semantic landmarks (`header`, `main`, `nav`) on storefront pages.
- Form fields with visible labels; errors exposed via `role="alert"`.
- Focus styles on interactive controls; skip links where applicable.
- RTL `dir` on `html` for Arabic locale.
- Touch targets on mobile header controls validated at 390px width in E2E.
- Automated axe scans documented under `docs/pro-readiness/*AXE*`.

## Known limitations

- Some admin data tables rely on horizontal scroll on narrow viewports.
- WhatsApp pairing QR/code display is visual-first; pairing instructions include text status.
- Third-party WhatsApp Web (Baileys) is outside this site’s accessibility boundary.

## Feedback

Contact the site operator via the published **Contact** page. For security issues, see `/.well-known/security.txt`.

## Review cadence

Re-run axe + manual keyboard pass before major releases; E2E includes RTL and touch-target smoke checks.
