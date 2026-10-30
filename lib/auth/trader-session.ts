import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
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

/** Only for the change-password action and sign-out — skips the gate above. */
export const requireTraderSessionAllowPasswordChange = cache(
  async (): Promise<TraderSession> => {
    const session = await getTraderSession();
    if (!session) {
      throw new Error("UNAUTHORIZED");
    }
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
      throw new Error("UNAUTHORIZED");
    }
    const currentPwv = trader.passwordChangedAt?.getTime() ?? 0;
    // A token issued before the last password change is a stale session on
    // another device/browser — treat it as signed out.
    if (session.pwv !== currentPwv) {
      throw new Error("UNAUTHORIZED");
    }
    // DB is authoritative — a stale JWT from before a reset must not let a
    // server action skip the gate.
    return {
      sub: trader.id,
      email: trader.email,
      displayName: trader.displayName,
      mustChangePassword: trader.mustChangePassword,
      pwv: currentPwv,
    };
  }
);

export const TRADER_SESSION_COOKIE = COOKIE_NAME;
