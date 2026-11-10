import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  hashPassword,
  verifyPassword,
} from "@/lib/auth/admin-session";

const COOKIE_NAME = "ro_trader_session";
const MAX_AGE_SEC = 60 * 60 * 12; // 12 hours

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 chars)");
  }
  return new TextEncoder().encode(secret);
}

export type TraderSession = {
  sub: string;
  email: string;
  displayName: string;
  mustChangePassword: boolean;
  /** passwordChangedAt.getTime(), or 0 if never changed — see admin-session.ts. */
  pwv: number;
};

export { hashPassword, verifyPassword };

export async function createTraderSessionToken(
  trader: TraderSession
): Promise<string> {
  return new SignJWT({
    email: trader.email,
    displayName: trader.displayName,
    role: "trader",
    mustChangePassword: trader.mustChangePassword,
    pwv: trader.pwv,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(trader.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(getSecret());
}

export async function verifyTraderSessionToken(
  token: string
): Promise<TraderSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.email !== "string") return null;
    if (payload.role !== "trader") return null;
    return {
      sub: payload.sub,
      email: payload.email,
      displayName:
        typeof payload.displayName === "string"
          ? payload.displayName
          : "Trader",
      mustChangePassword: payload.mustChangePassword === true,
      pwv: typeof payload.pwv === "number" ? payload.pwv : 0,
    };
  } catch {
    return null;
  }
}

export async function setTraderSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearTraderSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export const getTraderSession = cache(
  async (): Promise<TraderSession | null> => {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyTraderSessionToken(token);
  }
);

/**
 * Server-side trader auth. Identity always comes from the session cookie —
 * never trust a client-supplied traderId.
 * Use everywhere except the change-password action and sign-out: throws
 * MUST_CHANGE_PASSWORD so every other action is blocked server-side while
 * the flag is set, regardless of what the client UI shows.
 */
export const requireTraderSession = cache(async (): Promise<TraderSession> => {
  const session = await requireTraderSessionAllowPasswordChange();
  if (session.mustChangePassword) {
    throw new Error("MUST_CHANGE_PASSWORD");
  }
  return session;
});

type TraderSessionStatus =
  | { ok: true; session: TraderSession }
  | { ok: false; reason: "no-token" | "pwv-mismatch" };

/**
 * DB-authoritative: the JWT identity is trusted, but account status,
 * mustChangePassword, and the pwv (password-version) check always come from
 * the database, never the token alone — a stale JWT from before a reset or a
 * password change on another device must not pass.
 */
const getTraderSessionStatus = cache(
  async (): Promise<TraderSessionStatus> => {
    const session = await getTraderSession();
    if (!session) return { ok: false, reason: "no-token" };
    const trader = await prisma.traderAccount.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        status: true,
        email: true,
        displayName: true,
        mustChangePassword: true,
        passwordChangedAt: true,
      },
    });
    if (!trader || trader.status !== "active") {
      return { ok: false, reason: "no-token" };
    }
    const currentPwv = trader.passwordChangedAt?.getTime() ?? 0;
    // A token issued before the last password change is a stale session on
    // another device/browser — treat it as signed out, distinctly from
    // "never logged in" so callers can show the right message.
    if (session.pwv !== currentPwv) {
      return { ok: false, reason: "pwv-mismatch" };
    }
    return {
      ok: true,
      session: {
        sub: trader.id,
        email: trader.email,
        displayName: trader.displayName,
        mustChangePassword: trader.mustChangePassword,
        pwv: currentPwv,
      },
    };
  }
);

/**
 * DB-authoritative, non-throwing (status + pwv checked, mustChangePassword
 * NOT gated here — same shape as getAdminSession). Use where you need "is
 * this a real, current trader session" without the forced-change gate, e.g.
 * the brokerage media route (see L-1 in AUDIT-PHASE-1.md).
 */
export async function getTraderSessionDb(): Promise<TraderSession | null> {
  const status = await getTraderSessionStatus();
  return status.ok ? status.session : null;
}

/** Only for the change-password action and sign-out — skips the gate above. */
export async function requireTraderSessionAllowPasswordChange(): Promise<TraderSession> {
  const status = await getTraderSessionStatus();
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
 * generic error.tsx boundary. Call at the top of every protected trader
 * layout/page that needs the session.
 */
export async function requireTraderSessionOrRedirect(): Promise<TraderSession> {
  try {
    return await requireTraderSession();
  } catch (e) {
    if (e instanceof Error && e.message === "MUST_CHANGE_PASSWORD") {
      redirect("/trader/force-password-change");
    }
    if (e instanceof Error && e.message === "SESSION_INVALIDATED") {
      redirect("/trader/sign-out-stale");
    }
    redirect("/trader/login");
  }
}

/**
 * For Server Actions: on SESSION_INVALIDATED, clears the cookie and redirects
 * (the framework follows this the same way it follows a successful action's
 * redirect — no special client code needed). Any other session error falls
 * back to a plain ActionResult the action's own catch block can return.
 */
export async function handleTraderSessionError(
  e: unknown,
  fallbackError = "Unauthorized"
): Promise<{ ok: false; error: string }> {
  if (e instanceof Error && e.message === "SESSION_INVALIDATED") {
    await clearTraderSessionCookie();
    redirect("/trader/login?notice=session_invalidated");
  }
  return { ok: false, error: fallbackError };
}

export const TRADER_SESSION_COOKIE = COOKIE_NAME;
