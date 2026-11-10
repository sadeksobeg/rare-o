// Demo-only temporary password generator. In the real app this is generated
// server-side, hashed before storage, and the plaintext is shown to the
// admin exactly once — never logged, never retrievable afterward. The admin
// never sees (and the system never stores) the trader's actual password;
// a reset always issues a new temporary one that the trader must replace
// at next sign-in.
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generateTempPassword(length = 12): string {
  let out = "";
  const bytes = new Uint32Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 1e9);
  }
  for (let i = 0; i < length; i++) out += CHARS[bytes[i] % CHARS.length];
  return out;
}
