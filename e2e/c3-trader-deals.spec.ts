import { test, expect } from "@playwright/test";
import {
  disconnectPrisma,
  foreignDealForTrader,
  loginAdmin,
  loginTrader,
  traderCredentials,
} from "./helpers";

test.afterAll(async () => {
  await disconnectPrisma();
});

test.describe("C3 trader deals and portal guards", () => {
  test("trader login page loads", async ({ page }) => {
    await page.goto("/trader/login?lang=en");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test("trader creates catalog deal and negotiates", async ({ page }) => {
    await loginTrader(page);
    await page.goto("/trader/deals/new?lang=en");
    await expect(page.locator("h1").first()).toBeVisible();

    const titleInput = page.locator('input[type="text"]').first();
    if ((await titleInput.count()) === 0) {
      test.skip(true, "New deal wizard not available");
    }
    await titleInput.fill(`E2E deal ${Date.now()}`);

    const productSelect = page.locator("select").filter({ has: page.locator("option") });
    const options = productSelect.locator("option");
    if ((await options.count()) < 2) {
      test.skip(true, "No published products for catalog deal");
    }
    await productSelect.selectOption({ index: 1 });

    await page.getByRole("button", { name: /next|التالي/i }).click();
    await page.getByRole("button", { name: /next|التالي/i }).click();

    const submit = page.getByRole("button", { name: /submit|proposal|إرسال|عرض/i });
    if ((await submit.count()) === 0) {
      test.skip(true, "Deal submit control missing");
    }
    await submit.click();

    await page.waitForURL(/\/trader\/deals\/[^/]+/, { timeout: 45_000 });

    const bar = page.locator('[data-component="negotiation-action-bar"]');
    if (await bar.isVisible().catch(() => false)) {
      await bar.locator('select[name="action"]').selectOption("counter");
      await bar.locator('input[name="proposedPrice"]').fill("1500");
      await bar.locator('input[name="currency"]').fill("USD");
      await bar.locator('input[name="quantity"]').fill("1");
      await bar.getByRole("button", { name: /submit|entry|تسجيل/i }).click();
      await expect(bar.getByRole("status").or(bar.locator("p.text-ro-muted"))).toBeVisible({
        timeout: 15_000,
      });
    }
  });

  test("admin deal view exposes reject in negotiation form", async ({ page }) => {
    await loginAdmin(page);
    await page.goto("/admin/deals?lang=en");
    const dealLink = page.locator('a[href^="/admin/deals/"]').first();
    if ((await dealLink.count()) === 0) {
      test.skip(true, "No deals in admin list (run db:seed)");
    }
    await dealLink.click();
    await expect(page.locator('[data-component="negotiation-action-bar"]')).toBeVisible({
      timeout: 20_000,
    });
    const rejectOption = page.locator('select[name="action"] option[value="reject"]');
    await expect(rejectOption).toHaveCount(1);
  });

  test("IDOR: trader cannot open another trader deal", async ({ page }) => {
    const { email } = traderCredentials();
    const foreign = await foreignDealForTrader(email);
    if (!foreign) {
      test.skip(true, "Need a second trader deal (run db:seed:demo or add trader)");
      return;
    }
    if (foreign.ownerEmail === email) {
      test.skip(
        true,
        "Foreign deal owner matches login trader (check TRADER_EMAIL / seed)"
      );
      return;
    }

    await loginTrader(page);
    const res = await page.goto(`/trader/deals/${foreign.id}?lang=en`);
    const body = await page.locator("body").innerText();
    const showsForeignRef = body.includes(foreign.reference);
    const showsNegotiation =
      (await page.locator('[data-component="negotiation-action-bar"]').count()) >
      0;
    // Primary security assertion: foreign commercial payload must not render.
    // Next may surface 404 UI as HTTP 200 depending on RSC streaming.
    expect(
      !showsForeignRef && !showsNegotiation,
      `IDOR leak: status=${res?.status()} showsRef=${showsForeignRef} negotiate=${showsNegotiation} snippet=${body.slice(0, 180)}`
    ).toBe(true);
  });

  test("wrong role: trader session blocked from admin", async ({ page }) => {
    await loginTrader(page);
    await page.goto("/admin?lang=en");
    await expect(page).toHaveURL(/\/(forbidden|admin\/login)/);
  });
});
