import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const site = (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ""
  ).replace(/\/$/, "");
  const email = process.env.SECURITY_EMAIL || "";

  if (!site || !email || /\.local/i.test(site) || /\.local/i.test(email)) {
    return new NextResponse(
      "# misconfigured: set SITE_URL and SECURITY_EMAIL (non-.local)\n",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  const body = [
    `Contact: mailto:${email}`,
    `Canonical: ${site}/.well-known/security.txt`,
    `Policy: ${site}/privacy`,
    `Preferred-Languages: en, ar`,
    `Expires: ${expires.toISOString()}`,
    "",
  ].join("\n");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
