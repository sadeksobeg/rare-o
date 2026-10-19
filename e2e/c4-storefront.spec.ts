import { test, expect } from "@playwright/test";
import {
  addFirstProductViaPdp,
  disconnectPrisma,
  expectHandoffSuccess,
  goLocale,
} from "./helpers";
import { disconnectEnsureSeed, ensureE2EFixtures } from "./ensure-seed";

test.beforeAll(async () => {
  await ensureE2EFixtures();
});

test.afterAll(async () => {
  await disconnectPrisma();
  await disconnectEnsureSeed();
});

test.describe("C4 storefront UX", () => {
  test("catalog filters via URL params", async ({ page }) => {
    await goLocale(page, "/catalog", "en");
    const totalBefore = await page
      .locator("article")
      .count()
      .catch(() => 0);

    await goLocale(page, "/catalog?q=oud", "en");
    await expect(page.locator("h1").first()).toBeVisible();
    const totalFiltered = await page.locator("article").count();

    if (totalBefore > 0) {
      expect(totalFiltered).toBeLessThanOrEqual(totalBefore);
    }

    await goLocale(page, "/catalog?q=zzzz-no-match-e2e", "en");
    const empty = page
      .getByRole("heading", { level: 2 })
      .or(page.locator("text=/no results|لا نتائج/i"));
    if (totalBefore > 0) {
      await expect(empty.first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test("cart add and remove", async ({ page }) => {
    const added = await addFirstProductViaPdp(page);
    expect(added, "published catalog product required (db:seed)").toBe(true);

    await goLocale(page, "/cart", "en");
    await expect(page.locator("ul[aria-label]").first()).toBeVisible({
      timeout: 15_000,
    });

    const remove = page
      .getByRole("button", { name: /remove|إزالة|حذف/i })
      .first();
    await expect(remove, "cart remove control").toBeVisible({ timeout: 10_000 });
    await remove.click();
    await expect(page.locator("[data-variant]").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("unavailable product PDP handling", async ({ page }) => {
    await goLocale(page, "/product/cello-studio", "en");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
    const disabledAdd = page.locator("button[disabled]").filter({ hasText: /.+/ });
    const unavailableCopy = page.locator(
      "text=/unavailable|غير متوفر|contact us|تواصل/i"
    );
    const sawUnavailable =
      (await disabledAdd.first().isVisible().catch(() => false)) ||
      (await unavailableCopy.first().isVisible().catch(() => false));
    expect(sawUnavailable).toBe(true);
  });

  test("no horizontal overflow at 390 on home and catalog (AR)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ["/", "/catalog"] as const) {
      await goLocale(page, route, "ar");
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth > doc.clientWidth + 1;
      });
      expect(overflow, `overflow on ${route}`).toBe(false);
    }
  });

  test("header touch targets ≥44px at 390", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goLocale(page, "/", "ar");
    const header = page.locator("header");
    await expect(header).toBeVisible();
    const samples = header
      .locator("a, button")
      .filter({ hasNot: page.locator(".sr-only") });
    const count = Math.min(await samples.count(), 6);
    expect(count, "header interactive controls").toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const box = await samples.nth(i).boundingBox();
      if (!box) continue;
      expect(box.height, `control index ${i}`).toBeGreaterThanOrEqual(44);
    }
  });

  test("RTL dir on html for Arabic", async ({ page }) => {
    await goLocale(page, "/", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await goLocale(page, "/", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("request flow smoke", async ({ page }) => {
    const added = await addFirstProductViaPdp(page);
    expect(added, "catalog product for request smoke").toBe(true);

    await goLocale(page, "/request", "en");
    await expect(page.locator('input[name="customerName"]')).toBeVisible({
      timeout: 15_000,
    });
    await page.locator('input[name="customerName"]').fill("E2E Smoke");
    await page.locator('input[name="customerPhone"]').fill("963900000077");
    await page.locator('input[name="destinationCountry"]').fill("Syria");
    await page
      .getByRole("button", { name: /prepare request for handoff|تجهيز الطلب/i })
      .click();
    const alert = page.locator("form [role='alert']");
    await expect(alert).toBeHidden({ timeout: 5_000 });
    await expectHandoffSuccess(page);
  });
});
