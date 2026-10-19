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

  // Clone the request URL so search params (filters, q, sort) survive EN rewrites.
  // `new URL("/catalog", request.url)` drops the query string.
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
  return response;
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
 * Guard portal routes without changing JWT crypto.
 * Missing/invalid session → login.
 * Valid session for the *other* role → /forbidden (not login).
 */
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

/**
 * Logged-in traders must not land on public /offers — that swaps the portal
 * shell for the storefront and looks like lost permissions.
 */
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

  if (pathname === "/forbidden") {
    return NextResponse.next();
  }

  // Storefront English prefix → rewrite + locale en
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
    return withLocale(request, "en", stripped);
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const denied = await guardRole(request, "admin", "/admin/login");
    if (denied) return denied;
    return NextResponse.next();
  }

  if (pathname.startsWith("/trader") && !pathname.startsWith("/trader/login")) {
    const denied = await guardRole(request, "trader", "/trader/login");
    if (denied) return denied;
    return NextResponse.next();
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
    "/terms",
    "/cookies",
    "/forbidden",
    "/admin/:path*",
    "/trader/:path*",
  ],
};
