/** Shared policy for admin + trader password changes (forced or voluntary). */

export type PasswordPolicyError =
  | "MISMATCH"
  | "WEAK"
  | "SAME_AS_CURRENT"
  | "SAME_AS_EMAIL"
  | "CURRENT_WRONG";

export function checkNewPassword(
  newPassword: string,
  confirmPassword: string,
  currentPassword: string,
  email: string
): PasswordPolicyError | null {
  if (newPassword !== confirmPassword) return "MISMATCH";
  if (newPassword.length < 10) return "WEAK";
  if (newPassword === currentPassword) return "SAME_AS_CURRENT";
  if (newPassword.toLowerCase() === email.trim().toLowerCase()) {
    return "SAME_AS_EMAIL";
  }
  return null;
}
