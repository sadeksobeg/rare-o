import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { href } from "../lib/href";

/** Load `.env` into `process.env` without overriding existing vars (matches mint-session-cookies). */
export function loadProjectEnv(): void {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  }
}

loadProjectEnv();

export function adminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL ?? "admin@rareoud.local",
    password: process.env.ADMIN_PASSWORD ?? "ChangeMeNow!",
  };
}

export function traderCredentials() {
  return {
    email: process.env.TRADER_EMAIL ?? "trader@rareoud.local",
    password: process.env.TRADER_PASSWORD ?? "ChangeMeNow!",
  };
}

export async function loginAdmin(page: Page): Promise<void> {
  const { email, password } = adminCredentials();
  await page.goto("/admin/login?lang=en");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /sign in|دخول|تسجيل/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/admin/login"), {
    timeout: 30_000,
  });
}

export async function loginTrader(page: Page): Promise<void> {
  const { email, password } = traderCredentials();
  await page.goto("/trader/login?lang=en");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /sign in|دخول|تسجيل/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/trader/login"), {
    timeout: 30_000,
  });
}

function siteOrigin(): string {
  const raw =
    process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:3000";
  return raw.replace(/\/$/, "");
}

/** Navigate with locale cookie + `/en` prefix on storefront (matches middleware). */
export async function goLocale(
  page: Page,
  routePath: string,
  lang: "ar" | "en"
): Promise<void> {
  await page.context().addCookies([
    { name: "ro_locale", value: lang, url: siteOrigin() },
  ]);
  const qIndex = routePath.indexOf("?");
  const bare = qIndex >= 0 ? routePath.slice(0, qIndex) : routePath;
  const qs = qIndex >= 0 ? routePath.slice(qIndex) : "";
  const internal =
    bare.startsWith("/admin") || bare.startsWith("/trader")
      ? bare
      : href(bare, lang);
  await page.goto(`${internal}${qs}`);
}

export async function expectHandoffSuccess(page: Page): Promise<void> {
  const success = page.locator("section.mx-auto.max-w-xl [role='status'] h1").first();
  const alert = page.locator("form [role='alert']");
  await Promise.race([
    success.waitFor({ state: "visible", timeout: 30_000 }),
    alert.waitFor({ state: "visible", timeout: 30_000 }).then(async () => {
      const msg = await alert.innerText();
      throw new Error(msg || "Request submit failed");
    }),
  ]);
}

/** Add one unit of the first catalog product that is available on PDP. */
export async function addFirstProductViaPdp(page: Page): Promise<boolean> {
  await goLocale(page, "/catalog", "en");
  const links = page.locator('article a[href*="/product/"]');
  const count = await links.count();
  if (count === 0) return false;

  for (let i = 0; i < Math.min(count, 12); i += 1) {
    const href = await links.nth(i).getAttribute("href");
    const m = href?.match(/\/product\/([^/?#]+)/);
    const slug = m?.[1];
    if (!slug) continue;
    await goLocale(page, `/product/${slug}`, "en");
    const pdpAdd = page.locator("#pdp-cta button[type='button']");
    if ((await pdpAdd.count()) === 0) continue;
    await pdpAdd.first().click();
    await page
      .locator("header a[href*='/cart']")
      .first()
      .waitFor({ state: "visible", timeout: 10_000 })
      .catch(() => undefined);
    return true;
  }
  return false;
}

let prismaSingleton: PrismaClient | null = null;

function prisma(): PrismaClient {
  if (!prismaSingleton) prismaSingleton = new PrismaClient();
  return prismaSingleton;
}

/** Deal owned by a trader other than `traderEmail` (for IDOR checks). */
export async function foreignDealForTrader(
  traderEmail: string
): Promise<{ id: string; ownerEmail: string; reference: string } | null> {
  try {
    const me = await prisma().traderAccount.findUnique({
      where: { email: traderEmail },
      select: { id: true },
    });
    if (!me) return null;
    const other = await prisma().dealProposal.findFirst({
      where: {
        traderId: { not: me.id },
        trader: { email: { not: traderEmail } },
      },
      select: {
        id: true,
        reference: true,
        trader: { select: { email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    if (!other?.trader.email) return null;
    return {
      id: other.id,
      ownerEmail: other.trader.email,
      reference: other.reference,
    };
  } catch {
    return null;
  }
}

export async function countRetailRequestsByIdempotencyKey(
  key: string
): Promise<number> {
  try {
    return await prisma().retailRequest.count({
      where: { idempotencyKey: key },
    });
  } catch {
    return -1;
  }
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaSingleton) {
    await prismaSingleton.$disconnect();
    prismaSingleton = null;
  }
}
