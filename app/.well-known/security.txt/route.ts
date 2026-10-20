import { NextResponse } from "next/server";

function siteUrl(): string {
  return (
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://example.com"
  ).replace(/\/$/, "");
}

export async function GET() {
  const email =
    process.env.SECURITY_EMAIL?.trim() || "security@example.com";
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  const body = [
    `Contact: mailto:${email}`,
    `Canonical: ${siteUrl()}/.well-known/security.txt`,
    `Policy: ${siteUrl()}/privacy`,
    "Preferred-Languages: en, ar",
    `Expires: ${expires.toISOString()}`,
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
