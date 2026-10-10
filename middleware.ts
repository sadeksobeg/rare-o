import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_COOKIE = "ro_admin_session";
const TRADER_COOKIE = "ro_trader_session";
const LOCALE_COOKIE = "ro_locale";

function withLocale(
  request: NextRequest,
  locale: "ar" | "en",
  rewritePath?: string
) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-ro-locale", locale);

  const response = rewritePath
    ? NextResponse.rewrite(new URL(rewritePath, request.url), {
        request: { headers: requestHeaders },
      })
    : NextResponse.next({
        request: { headers: requestHeaders },
      });

  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
  });
  return response;
}

async function guardRole(
  request: NextRequest,
  cookieName: string,
  role: "admin" | "trader",
  loginPath: string
) {
  const secret = process.env.AUTH_SECRET;
  const token = request.cookies.get(cookieName)?.value;
  if (!token || !secret || secret.length < 16) {
    return NextResponse.redirect(new URL(loginPath, request.url));
  }
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    if (payload.role !== role) {
      return NextResponse.redirect(new URL(loginPath, request.url));
    }
  } catch {
    return NextResponse.redirect(new URL(loginPath, request.url));
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Storefront English prefix → rewrite + locale en
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const stripped = pathname === "/en" ? "/" : pathname.slice(3) || "/";
    if (
      stripped.startsWith("/admin") ||
      stripped.startsWith("/trader") ||
      stripped.startsWith("/dev")
    ) {
      return NextResponse.redirect(new URL(stripped, request.url));
    }
    return withLocale(request, "en", stripped);
  }

  // Auth guards (JWT unchanged)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const denied = await guardRole(
      request,
      ADMIN_COOKIE,
      "admin",
      "/admin/login"
    );
    if (denied) return denied;
    return NextResponse.next();
  }

  if (pathname.startsWith("/trader") && !pathname.startsWith("/trader/login")) {
    const denied = await guardRole(
      request,
      TRADER_COOKIE,
      "trader",
      "/trader/login"
    );
    if (denied) return denied;
    return NextResponse.next();
  }

  // Public storefront Arabic paths
  if (
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/trader") &&
    !pathname.startsWith("/dev") &&
    !pathname.startsWith("/api")
  ) {
    return withLocale(request, "ar");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/en",
    "/en/:path*",
    "/catalog",
    "/catalog/:path*",
    "/product/:path*",
    "/cart",
    "/request",
    "/offers",
    "/offers/:path*",
    "/contact",
    "/privacy",
    "/admin/:path*",
    "/trader/:path*",
  ],
};
