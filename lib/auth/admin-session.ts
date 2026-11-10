import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

const COOKIE_NAME = "ro_admin_session";
const MAX_AGE_SEC = 60 * 60 * 12; // 12 hours
const ADMIN_ROLE = "admin";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 chars)");
  }
  return new TextEncoder().encode(secret);
}

export type AdminSession = {
  sub: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
  /** passwordChangedAt.getTime(), or 0 if never changed — a token whose pwv
   *  doesn't match the DB's current value was issued before a later
   *  password change and is treated as invalid (other devices/sessions). */
  pwv: number;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function createAdminSessionToken(
  admin: AdminSession
): Promise<string> {
  return new SignJWT({
    email: admin.email,
    name: admin.name,
    role: ADMIN_ROLE,
    mustChangePassword: admin.mustChangePassword,
    pwv: admin.pwv,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(getSecret());
}

export async function verifyAdminSessionToken(
  token: string
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.email !== "string") return null;
    // Reject trader (or other) tokens placed in the admin cookie
    if (payload.role !== ADMIN_ROLE) return null;
    return {
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : "Admin",
      mustChangePassword: payload.mustChangePassword === true,
      pwv: typeof payload.pwv === "number" ? payload.pwv : 0,
    };
  } catch {
    return null;
  }
}

export async function setAdminSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/**
 * JWT-only session for shell chrome. Middleware already guards /admin routes;
 * avoids a DB round-trip on every soft navigation.
 */
export const getAdminSessionChrome = cache(
  async (): Promise<AdminSession | null> => {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyAdminSessionToken(token);
  }
);

type AdminSessionStatus =
  | { ok: true; session: AdminSession }
  | { ok: false; reason: "no-token" | "pwv-mismatch" };

/**
 * DB-authoritative: the JWT role + subject are trusted, but mustChangePassword
 * and the pwv (password-version) check always come from the database, never
 * the token alone — a stale JWT from before a reset or a password change on
 * another device must not pass.
 */
const getAdminSessionStatus = cache(
  async (): Promise<AdminSessionStatus> => {
    const session = await getAdminSessionChrome();
    if (!session) return { ok: false, reason: "no-token" };
    const row = await prisma.adminUser.findUnique({
      where: { id: session.sub },
      select: { mustChangePassword: true, passwordChangedAt: true },
    });
    if (!row) return { ok: false, reason: "no-token" };
    const currentPwv = row.passwordChangedAt?.getTime() ?? 0;
    // A token issued before the last password change is a stale session on
    // another device/browser — treat it as signed out, distinctly from
    // "never logged in" so callers can show the right message.
    if (session.pwv !== currentPwv) return { ok: false, reason: "pwv-mismatch" };
    return {
      ok: true,
      session: { ...session, mustChangePassword: row.mustChangePassword },
    };
  }
);

/**
 * Returns a session only when the JWT is an admin role AND the AdminUser still exists.
 * Prevents trader JWTs (same AUTH_SECRET) from being treated as admin sessions.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const status = await getAdminSessionStatus();
  return status.ok ? status.session : null;
}

/**
 * Use everywhere except the change-password action and sign-out: throws
 * MUST_CHANGE_PASSWORD so every other action is blocked server-side while
 * the flag is set, regardless of what the client UI shows.
 */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await requireAdminSessionAllowPasswordChange();
  if (session.mustChangePassword) {
    throw new Error("MUST_CHANGE_PASSWORD");
  }
  return session;
}

/** Only for the change-password action and sign-out — skips the gate above. */
export async function requireAdminSessionAllowPasswordChange(): Promise<AdminSession> {
  const status = await getAdminSessionStatus();
  if (!status.ok) {
    throw new Error(
      status.reason === "pwv-mismatch" ? "SESSION_INVALIDATED" : "UNAUTHORIZED"
    );
  }
  return status.session;
}

/**
 * For Server Component pages/layouts: redirects cleanly instead of letting
 * MUST_CHANGE_PASSWORD / SESSION_INVALIDATED / UNAUTHORIZED bubble to the
 * generic error.tsx boundary. Call at the top of every protected admin
 * layout/page that needs the session.
 */
export async function requireAdminSessionOrRedirect(): Promise<AdminSession> {
  try {
    return await requireAdminSession();
  } catch (e) {
    if (e instanceof Error && e.message === "MUST_CHANGE_PASSWORD") {
      redirect("/admin/force-password-change");
    }
    if (e instanceof Error && e.message === "SESSION_INVALIDATED") {
      redirect("/admin/sign-out-stale");
    }
    redirect("/admin/login");
  }
}

/**
 * For Server Actions: on SESSION_INVALIDATED, clears the cookie and redirects
 * (the framework follows this the same way it follows a successful action's
 * redirect — no special client code needed). Any other session error falls
 * back to a plain ActionResult the action's own catch block can return.
 */
export async function handleAdminSessionError(
  e: unknown,
  fallbackError = "Unauthorized"
): Promise<{ ok: false; error: string }> {
  if (e instanceof Error && e.message === "SESSION_INVALIDATED") {
    await clearAdminSessionCookie();
    redirect("/admin/login?notice=session_invalidated");
  }
  return { ok: false, error: fallbackError };
}

export const ADMIN_SESSION_COOKIE = COOKIE_NAME;
export const ADMIN_SESSION_ROLE = ADMIN_ROLE;
