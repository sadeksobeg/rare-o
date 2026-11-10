# Phase 3 — Auth and account experience

Branch: `phase/03-auth`. Scope: AUTH-01 … AUTH-07 (MASTER-BUILD-PLAN Part C1).
Builds on Phase 1 security logic; no WhatsApp production enablement; no Prisma schema changes.

## Quality gate

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npx next lint` on touched files | PASS (see session log) |

Videos / multi-viewport screenshots / axe: not produced in this pass (no Playwright phase flag). Manual review remains owner DoD.

## Screen status

| ID | Route / surface | Status | Notes |
|---|---|---|---|
| AUTH-01 | `/admin/login` | Done | Dict-driven copy; Caps Lock; rate-limit footer; TOTP field; forgot view; session-invalidated notice; LogoScene ceremony unchanged. |
| AUTH-02 | `/trader/login` | Done | Same form; trader subtitle; WhatsApp “request account” footer; forgot view. |
| AUTH-03 | In-login forgot view | Done | No self-serve email reset (system does not support it). Explains admin-managed recovery + WhatsApp CTA via `whatsAppGreetingLink`. |
| AUTH-04 | `/admin\|trader/force-password-change` | Done (polish) | Existing policy + strength meter + live rules; atmosphere wash on the screen wrapper. |
| AUTH-05 | Login TOTP + `/admin/.../settings/security` + profile Security tab | Done (existing) | Inline TOTP on admin login; enrollment on security settings. **“Remember this device” not supported** — reported, not invented. |
| AUTH-06 | 403 / 404 / error / offline banner / `/session-expired` | Done | Added branded `/session-expired?portal=admin\|trader`. Soft atmosphere on forbidden + route error. Offline remains banner-only (no SW — same Phase 2 decision). |
| AUTH-07 | `/admin/(protected)/profile`, `/trader/(protected)/profile` | Done | Admin profile new: cover + initials, tabs (profile / security / sessions), password + 2FA reuse, sign-out-others via `pwv` bump. Header email chip → profile. Trader: existing profile + sign-out-others. **Avatar upload deferred** — `AdminUser` has no avatar column; copy explains gap. Theme preference not in real app — language stays header toggle. |

## Security actions added

- `adminInvalidateOtherSessionsAction` — sets `passwordChangedAt`, reissues admin JWT with new `pwv`, audit `admin.sessions.invalidate_others`.
- `traderInvalidateOtherSessionsAction` — same for traders (no audit table for traders).

Password change continues to invalidate other sessions as before.

## Gaps left for owner (not silently invented)

1. Profile photo upload/crop (needs storage field + media pipeline).
2. Dedicated device list (no session store beyond JWT `pwv`).
3. Remember-this-device for 2FA.
4. Full i18n of admin TOTP enrollment helper strings inside `security-settings.tsx` (still partly EN).
5. Playwright evidence videos for the Phase 3 DoD checklist.
