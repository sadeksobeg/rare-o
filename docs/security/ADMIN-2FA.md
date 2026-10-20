# Admin 2FA (TOTP)

**Status:** Implemented (Closure F3).

## Model

`AdminUser` fields:

| Field | Purpose |
|-------|---------|
| `totpSecretEnc` | AES-256-GCM blob (base64) of base32 TOTP secret |
| `totpRecoveryHashes` | JSON array of bcrypt hashes for one-time recovery codes |
| `totpEnabledAt` | Set when enrollment is confirmed; login requires TOTP when set |

Encryption key: HMAC-SHA256 of `AUTH_SECRET` with domain `"rare-oud-totp"` (`lib/auth/totp.ts`).

## Login flow

1. Email + password validated (`adminLoginAction`).
2. If `totpEnabledAt` and `totpSecretEnc` are set, `totpCode` is required (6-digit TOTP or recovery code).
3. Recovery codes are consumed on use and removed from `totpRecoveryHashes`.
4. Successful login writes `AdminAuditLog` action `admin.login`.

Optional env `REQUIRE_ADMIN_2FA=1` blocks login until 2FA is enrolled.

## Enrollment (admin UI)

`/admin/settings/security` — stub UI:

- `enrollAdminTotpAction` — generates secret + recovery codes (stored encrypted, `totpEnabledAt` cleared until confirm).
- `confirmAdminTotpAction` — verifies live TOTP, sets `totpEnabledAt`.

## Tests

```bash
npm run test:f3-2fa
```

## Operator notes

- Store recovery codes offline after enrollment.
- Rotate `AUTH_SECRET` only with a planned TOTP re-enrollment (secrets are keyed to `AUTH_SECRET`).
