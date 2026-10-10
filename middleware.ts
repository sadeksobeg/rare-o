import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_COOKIE = "ro_admin_session";
const TRADER_COOKIE = "ro_trader_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = process.env.AUTH_SECRET;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!token || !secret || secret.length < 16) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret)
      );
      // Must be an admin-role token — reject trader JWTs sharing AUTH_SECRET
      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (
    pathname.startsWith("/trader") &&
    !pathname.startsWith("/trader/login")
  ) {
    const token = request.cookies.get(TRADER_COOKIE)?.value;
    if (!token || !secret || secret.length < 16) {
      return NextResponse.redirect(new URL("/trader/login", request.url));
    }
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret)
      );
      if (payload.role !== "trader") {
        return NextResponse.redirect(new URL("/trader/login", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/trader/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/trader/:path*"],
};
