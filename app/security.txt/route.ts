import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 86400;

const BODY = `# Rare Oud platform — security contact
Contact: mailto:security@rareoud.local
Preferred-Languages: en, ar
Canonical: https://rareoud.local/.well-known/security.txt
Policy: https://rareoud.local/privacy
Expires: 2027-10-19T00:00:00.000Z

# Replace contact and Canonical with production domain before go-live.
`;

export async function GET() {
  return new NextResponse(BODY, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
