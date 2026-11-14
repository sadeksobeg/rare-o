import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  buildContentSecurityPolicy,
  createCspNonce,
  CSP_NONCE_HEADER,
} from "@/lib/security/csp";

const ADMIN_COOKIE = "ro_admin_session";
const TRADER_COOKIE = "ro_trader_session";
const LOCALE_COOKIE = "ro_locale";

function applySecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  const isProd = process.env.NODE_ENV === "production";
  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(nonce, isProd)
  );
  response.headers.set(CSP_NONCE_HEADER, nonce);
  response.cookies.set("ro_csp_nonce", nonce, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: isProd,
    maxAge: 60,
  });
  return response;
}

function withLocale(
  request: NextRequest,
  locale: "ar" | "en",
  rewritePath?: string,
  nonce?: string
) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-ro-locale", locale);
  if (nonce) requestHeaders.set(CSP_NONCE_HEADER, nonce);

  const response = rewritePath
    ? (() => {
        const target = request.nextUrl.clone();
        target.pathname = rewritePath;
        return NextResponse.rewrite(target, {
          request: { headers: requestHeaders },
        });
      })()
    : NextResponse.next({
        request: { headers: requestHeaders },
      });

  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
  });
  return nonce ? applySecurityHeaders(response, nonce) : response;
}

async function readRole(
  token: string | undefined,
  secret: string
): Promise<"admin" | "trader" | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    if (payload.role === "admin" || payload.role === "trader") {
      return payload.role;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Edge-only check: the JWT claim is good enough here because the
 * action-level guard (requireAdminSession / requireTraderSession) is
 * authoritative against the DB on every server action and page render —
 * see lib/auth/admin-session.ts and lib/auth/trader-session.ts.
 */
async function mustChangePasswordFromToken(
  token: string | undefined,
  secret: string
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    return payload.mustChangePassword === true;
  } catch {
    return false;
  }
}

async function guardRole(
  request: NextRequest,
  expected: "admin" | "trader",
  loginPath: string
) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  const ownCookie = expected === "admin" ? ADMIN_COOKIE : TRADER_COOKIE;
  const otherCookie = expected === "admin" ? TRADER_COOKIE : ADMIN_COOKIE;
  const otherRole = expected === "admin" ? "trader" : "admin";

  const ownRole = await readRole(request.cookies.get(ownCookie)?.value, secret);
  if (ownRole === expected) return null;

  const crossRole = await readRole(
    request.cookies.get(otherCookie)?.value,
    secret
  );
  if (crossRole === otherRole) {
    const url = new URL("/forbidden", request.url);
    url.searchParams.set("portal", otherRole);
    return NextResponse.redirect(url);
  }

  const loginUrl = new URL(loginPath, request.url);
  const returnTo = request.nextUrl.pathname + request.nextUrl.search;
  if (returnTo && returnTo !== loginPath) {
    loginUrl.searchParams.set("returnTo", returnTo);
  }
  return NextResponse.redirect(loginUrl);
}

async function redirectTraderFromPublicOffers(
  request: NextRequest,
  barePath: string
): Promise<NextResponse | null> {
  if (barePath !== "/offers" && !barePath.startsWith("/offers/")) {
    return null;
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) return null;

  const role = await readRole(
    request.cookies.get(TRADER_COOKIE)?.value,
    secret
  );
  if (role !== "trader") return null;

  const slug =
    barePath === "/offers" ? "" : barePath.slice("/offers/".length).split("/")[0];
  const targetPath = slug ? `/trader/offers/${slug}` : "/trader/offers";
  const url = new URL(targetPath, request.url);
  url.search = request.nextUrl.search;
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = createCspNonce();

  // Dev fixtures (/dev/*) must never be reachable in production builds.
  if (
    process.env.NODE_ENV === "production" &&
    (pathname === "/dev" || pathname.startsWith("/dev/"))
  ) {
    return new NextResponse(null, { status: 404 });
  }

  if (pathname === "/forbidden") {
    const headers = new Headers(request.headers);
    headers.set(CSP_NONCE_HEADER, nonce);
    return applySecurityHeaders(
      NextResponse.next({ request: { headers } }),
      nonce
    );
  }

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const stripped = pathname === "/en" ? "/" : pathname.slice(3) || "/";
    if (
      stripped.startsWith("/admin") ||
      stripped.startsWith("/trader") ||
      stripped.startsWith("/dev") ||
      stripped.startsWith("/forbidden")
    ) {
      return NextResponse.redirect(new URL(stripped, request.url));
    }
    const traderOffers = await redirectTraderFromPublicOffers(
      request,
      stripped
    );
    if (traderOffers) return traderOffers;
    return withLocale(request, "en", stripped, nonce);
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const denied = await guardRole(request, "admin", "/admin/login");
    if (denied) return denied;
    const forcePath = "/admin/force-password-change";
    const secret = process.env.AUTH_SECRET ?? "";
    const mustChange = await mustChangePasswordFromToken(
      request.cookies.get(ADMIN_COOKIE)?.value,
      secret
    );
    if (mustChange && pathname !== forcePath) {
      return NextResponse.redirect(new URL(forcePath, request.url));
    }
    if (!mustChange && pathname === forcePath) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    const headers = new Headers(request.headers);
    headers.set(CSP_NONCE_HEADER, nonce);
    return applySecurityHeaders(
      NextResponse.next({ request: { headers } }),
      nonce
    );
  }

  if (pathname.startsWith("/trader") && !pathname.startsWith("/trader/login")) {
    const denied = await guardRole(request, "trader", "/trader/login");
    if (denied) return denied;
    const forcePath = "/trader/force-password-change";
    const secret = process.env.AUTH_SECRET ?? "";
    const mustChange = await mustChangePasswordFromToken(
      request.cookies.get(TRADER_COOKIE)?.value,
      secret
    );
    if (mustChange && pathname !== forcePath) {
      return NextResponse.redirect(new URL(forcePath, request.url));
    }
    if (!mustChange && pathname === forcePath) {
      return NextResponse.redirect(new URL("/trader", request.url));
    }
    const headers = new Headers(request.headers);
    headers.set(CSP_NONCE_HEADER, nonce);
    return applySecurityHeaders(
      NextResponse.next({ request: { headers } }),
      nonce
    );
  }

  if (
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/trader") &&
    !pathname.startsWith("/dev") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/forbidden")
  ) {
    const traderOffers = await redirectTraderFromPublicOffers(
      request,
      pathname
    );
    if (traderOffers) return traderOffers;
    return withLocale(request, "ar", undefined, nonce);
  }

  const headers = new Headers(request.headers);
  headers.set(CSP_NONCE_HEADER, nonce);
  return applySecurityHeaders(
    NextResponse.next({ request: { headers } }),
    nonce
  );
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
    "/terms",
    "/cookies",
    "/forbidden",
    "/track/:path*",
    "/order/:path*",
    "/invoice/:path*",
    "/admin/:path*",
    "/trader/:path*",
    "/dev",
    "/dev/:path*",
  ],
};
