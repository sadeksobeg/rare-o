/**
 * Public quote API security checks (Release 2a).
 * Run: npx tsx scripts/shipping-security-checks.ts
 * Expects PLAYWRIGHT_BASE_URL or http://127.0.0.1:3000
 */
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const QUOTE_URL = `${BASE}/api/shipping/quote`;

type Check = { name: string; ok: boolean; detail: string };
const results: Check[] = [];

function note(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}: ${name} — ${detail}`);
}

async function post(body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(QUOTE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* leave null */
  }
  return { status: res.status, text, json };
}

function hasLeak(text: string): boolean {
  return (
    /at\s+\w+\s+\(|node_modules|prisma\.|AUTH_SECRET|DATABASE_URL|stack|TypeError|PrismaClient/i.test(
      text
    ) || /"password"|"email"\s*:\s*"[^"]+@/.test(text)
  );
}

async function main() {
  // 1) invalid JSON / missing destination -> uniform 400
  const badJson = await post("{");
  note(
    "invalid JSON -> 400 uniform",
    badJson.status === 400 &&
      typeof (badJson.json as { error?: string })?.error === "string" &&
      !hasLeak(badJson.text),
    `status=${badJson.status} body=${badJson.text.slice(0, 120)}`
  );

  const noDest = await post({ weightKg: 20 });
  note(
    "missing destination -> 400",
    noDest.status === 400 &&
      (noDest.json as { error?: string })?.error === "DESTINATION_REQUIRED" &&
      !hasLeak(noDest.text),
    `status=${noDest.status}`
  );

  const badWeight = await post({ destinationCode: "DE", weightKg: -1 });
  note(
    "negative weight -> 400",
    badWeight.status === 400 && !hasLeak(badWeight.text),
    `status=${badWeight.status}`
  );

  const hugeDest = await post({ destinationCode: "X".repeat(80), weightKg: 20 });
  note(
    "oversized destination -> 400",
    hugeDest.status === 400 && !hasLeak(hugeDest.text),
    `status=${hugeDest.status}`
  );

  // 2) items array size cap (50) — request with 60 items still 200/400 without leak
  const manyItems = await post({
    destinationCode: "DE",
    items: Array.from({ length: 60 }, (_, i) => ({ productId: `p${i}`, qty: 1 })),
  });
  note(
    "items array capped / no leak",
    (manyItems.status === 200 || manyItems.status === 400) && !hasLeak(manyItems.text),
    `status=${manyItems.status}`
  );

  // 3) happy path DE 20 — no unverified notebook flats
  const okDe = await post({ destinationCode: "DE", weightKg: 20, audience: "CUSTOMER" });
  const methods =
    ((okDe.json as { methods?: { code: string; amount: number; currency: string }[] })
      ?.methods ?? []);
  const codes = methods.map((m) => m.code);
  const hasNotebook = codes.some(
    (c) =>
      c.includes("LAND_") ||
      c.includes("SHARJAH") ||
      c.includes("MASRI") ||
      c.includes("RAQI")
  );
  note(
    "DE 20 public methods legacy only",
    okDe.status === 200 &&
      !hasNotebook &&
      methods.some((m) => m.code.includes("germany:land") && m.amount === 130) &&
      methods.some((m) => m.code.includes("germany:air") && m.amount === 150) &&
      !hasLeak(okDe.text),
    `codes=${codes.join(",")}`
  );

  // 4) notebook destination publicly must not expose unverified flats
  for (const code of ["LB", "JO", "SA"] as const) {
    const q = await post({ destinationCode: code, weightKg: 20, audience: "CUSTOMER" });
    const ms =
      ((q.json as { methods?: { code: string; amount: number }[] })?.methods ?? []);
    const flatNotebook = ms.some((m) =>
      /LAND_|SHARJAH|MASRI|RAQI/.test(m.code)
    );
    note(
      `${code}: unverified notebook not public`,
      q.status === 200 && !flatNotebook && !hasLeak(q.text),
      `methods=${ms.map((m) => m.code).join(",") || "(none/inquiry)"}`
    );
  }

  // 5) includeUnverified must be ignored if client tries to pass it
  const sneak = await post({
    destinationCode: "LB",
    weightKg: 20,
    audience: "CUSTOMER",
    includeUnverified: true,
  } as Record<string, unknown>);
  const sneakMethods =
    ((sneak.json as { methods?: { code: string }[] })?.methods ?? []);
  note(
    "client includeUnverified ignored",
    sneak.status === 200 &&
      !sneakMethods.some((m) => m.code.includes("LAND_PASSENGER")) &&
      !hasLeak(sneak.text),
    `methods=${sneakMethods.map((m) => m.code).join(",") || "(none)"}`
  );

  // 6) rate limit -> 429 (burst)
  let hit429 = false;
  let leakOn429 = false;
  for (let i = 0; i < 70; i++) {
    const r = await post(
      { destinationCode: "DE", weightKg: 20 },
      { "x-forwarded-for": "203.0.113.77" }
    );
    if (r.status === 429) {
      hit429 = true;
      if (hasLeak(r.text)) leakOn429 = true;
      break;
    }
  }
  note(
    "rate limit returns 429",
    hit429 && !leakOn429,
    hit429 ? "got 429 without leak" : "did not hit 429 within 70 calls"
  );

  // 7) unknown country — uniform response, no enumeration of internals
  const br = await post({ destinationCode: "BR", weightKg: 20 });
  const brMethods = ((br.json as { methods?: unknown[] })?.methods ?? []).length;
  note(
    "unknown country uniform (no leak)",
    br.status === 200 && brMethods === 0 && !hasLeak(br.text),
    `status=${br.status} methods=${brMethods}`
  );

  const failed = results.filter((r) => !r.ok);
  console.log("\n--- summary ---");
  console.log(`passed ${results.length - failed.length}/${results.length}`);
  if (failed.length) {
    console.log("FAILED:", failed.map((f) => f.name).join("; "));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
