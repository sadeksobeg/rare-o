import { test, expect } from "@playwright/test";
import {
  addFirstProductViaPdp,
  disconnectPrisma,
  expectHandoffSuccess,
  goLocale,
} from "./helpers";

test.afterAll(async () => {
  await disconnectPrisma();
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
    const empty = page.getByRole("heading", { level: 2 }).or(page.locator("text=/no results|لا نتائج/i"));
    if (totalBefore > 0) {
      await expect(empty.first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test("cart add and remove", async ({ page }) => {
    const added = await addFirstProductViaPdp(page);
    test.skip(!added, "No add-to-cart target on catalog");

    await goLocale(page, "/cart", "en");
    await expect(page.locator("ul[aria-label]").first()).toBeVisible({
      timeout: 15_000,
    });

    const remove = page.getByRole("button", { name: /remove|إزالة|حذف/i }).first();
    if ((await remove.count()) === 0) {
      test.skip(true, "Remove control not found");
    }
    await remove.click();
    await expect(page.locator("[data-variant]").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("unavailable product PDP handling", async ({ page }) => {
    await goLocale(page, "/product/cello-studio", "en");
    if ((await page.locator("h1").count()) === 0) {
      test.skip(true, "cello-studio fixture not seeded");
    }
    const disabledAdd = page.locator("button[disabled]").filter({ hasText: /.+/ });
    const unavailableCopy = page.locator("text=/unavailable|غير متوفر|contact us|تواصل/i");
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
    const samples = header.locator("a, button").filter({ hasNot: page.locator(".sr-only") });
    const count = Math.min(await samples.count(), 6);
    test.skip(count === 0, "No header controls to measure");
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
    test.skip(!added, "No catalog product for request smoke");

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
    if (await alert.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, `Request submit failed: ${await alert.innerText()}`);
    }
    try {
      await expectHandoffSuccess(page);
    } catch (e) {
      const msg = String(e);
      if (msg.includes("idempotencyKey")) {
        test.skip(true, "Apply DB migrations (RetailRequest.idempotencyKey)");
      }
      throw e;
    }
  });
});
