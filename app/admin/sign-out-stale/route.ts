import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clearAdminSessionCookie } from "@/lib/auth/admin-session";

/**
 * A session invalidated by a password change on another device lands here
 * (from the protected layout's redirect) for a clean sign-out instead of a
 * dead-end error screen. Clears the cookie, then sends the browser to the
 * login page with a notice the login page renders.
 */
export async function GET(request: NextRequest) {
  await clearAdminSessionCookie();
  return NextResponse.redirect(
    new URL("/admin/login?notice=session_invalidated", request.url)
  );
}
