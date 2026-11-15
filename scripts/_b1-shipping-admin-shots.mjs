import { chromium } from "@playwright/test";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/shipping/shots");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k] || k === "DATABASE_URL") {
    process.env[k] = v;
  }
}

fs.mkdirSync(OUT, { recursive: true });
const prisma = new PrismaClient();
const admin = await prisma.adminUser.findFirst({ orderBy: { createdAt: "asc" } });
if (!admin) throw new Error("no admin user");
const token = await new SignJWT({
  email: admin.email,
  name: admin.name ?? "Admin",
  role: "admin",
  mustChangePassword: false,
  pwv: admin.passwordChangedAt?.getTime() ?? 0,
})
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(admin.id)
  .setIssuedAt()
  .setExpirationTime("12h")
  .sign(new TextEncoder().encode(process.env.AUTH_SECRET));
await prisma.$disconnect();

const shots = [
  { route: "/admin/shipping/rates", file: "b1-admin-rates-matrix-1440-ar.png" },
  { route: "/admin/shipping/simulator", file: "b1-admin-simulator-1440-ar.png" },
  { route: "/admin/shipping/countries", file: "b1-admin-countries-1440-ar.png" },
  { route: "/admin/shipping", file: "b1-admin-shipping-hub-1440-ar.png" },
];

const browser = await chromium.launch();
const context = await browser.newContext({
  locale: "ar",
  viewport: { width: 1440, height: 900 },
});
await context.addCookies([
  {
    name: "ro_admin_session",
    value: token,
    url: BASE,
    httpOnly: true,
    sameSite: "Lax",
  },
]);
const page = await context.newPage();
const evidence = {};

for (const s of shots) {
  await page.goto(`${BASE}${s.route}`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(900);
  await hideNextDevIndicator(page);
  const text = (await page.evaluate(() => document.body.innerText))
    .replace(/\s+/g, " ")
    .slice(0, 320);
  const docH = await page.evaluate(() =>
    Math.min(8000, Math.max(document.documentElement.scrollHeight, 900))
  );
  await page.setViewportSize({ width: 1440, height: docH });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, s.file), fullPage: false });
  evidence[s.file] = { route: s.route, see: text };
  console.log("wrote", s.file, "—", text.slice(0, 120));
}

// History: open first rate's history if present
await page.goto(`${BASE}/admin/shipping/rates`, {
  waitUntil: "networkidle",
  timeout: 90000,
});
await page.waitForTimeout(600);
const histBtn = page.locator("button,a").filter({ hasText: /تاريخ|History/i }).first();
if (await histBtn.count()) {
  await histBtn.click();
  await page.waitForTimeout(700);
}
await hideNextDevIndicator(page);
const histText = (await page.evaluate(() => document.body.innerText))
  .replace(/\s+/g, " ")
  .slice(0, 320);
await page.screenshot({
  path: path.join(OUT, "b1-admin-rates-history-1440-ar.png"),
  fullPage: true,
});
evidence["b1-admin-rates-history-1440-ar.png"] = {
  route: "/admin/shipping/rates (history)",
  see: histText,
};
console.log("wrote b1-admin-rates-history-1440-ar.png");

fs.writeFileSync(
  path.join(OUT, "b1-admin-shots.json"),
  JSON.stringify({ evidence }, null, 2)
);
await browser.close();
