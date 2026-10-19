# Admin 2FA (TOTP) — design stubs

**Status:** Not implemented in schema (no migration in Closure E3). Documented API for a follow-up slice.

## Rationale

bcrypt + jose already secure password login; TOTP adds defense when passwords leak. `otplib` is **not** a dependency — a future implementation can use Node `crypto` HMAC-SHA1 (RFC 6238) or add `otplib`.

## Proposed data model (future migration)

```prisma
model AdminUser {
  // existing fields…
  totpSecretEnc String?   // AES-GCM blob or sealed box
  totpEnabled   Boolean   @default(false)
}
```

Store **hashed** backup codes separately if needed.

## Proposed routes / actions

| Endpoint / action | Purpose |
|-------------------|---------|
| `POST /api/admin/totp/enroll` | Generate secret, return `otpauth://` URI (admin session required) |
| `POST /api/admin/totp/verify` | Confirm code, set `totpEnabled` |
| `adminLoginAction` step 2 | If `totpEnabled`, require `totpCode` field before issuing JWT |

## Current behavior

Single-factor admin login only (`adminLoginSchema` — email + password).
