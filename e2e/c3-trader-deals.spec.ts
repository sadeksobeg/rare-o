import { test, expect } from "@playwright/test";
import {
  disconnectPrisma,
  foreignDealForTrader,
  loginAdmin,
  loginTrader,
  traderCredentials,
} from "./helpers";
import { disconnectEnsureSeed, ensureE2EFixtures } from "./ensure-seed";

test.beforeAll(async () => {
  await ensureE2EFixtures();
});

test.afterAll(async () => {
  await disconnectPrisma();
  await disconnectEnsureSeed();
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
    await expect(titleInput, "deal wizard title field").toBeVisible();
    await titleInput.fill(`E2E deal ${Date.now()}`);

    const productSelect = page.locator("select").filter({ has: page.locator("option") });
    const options = productSelect.locator("option");
    expect(await options.count(), "published products for catalog deal").toBeGreaterThanOrEqual(
      2
    );
    await productSelect.selectOption({ index: 1 });

    await page.getByRole("button", { name: /next|التالي/i }).click();
    await page.getByRole("button", { name: /next|التالي/i }).click();

    const submit = page.getByRole("button", {
      name: /submit|proposal|إرسال|عرض/i,
    });
    await expect(submit, "deal submit control").toBeVisible();
    await submit.click();

    await page.waitForURL(/\/trader\/deals\/[^/]+/, { timeout: 45_000 });

    const bar = page.locator('[data-component="negotiation-action-bar"]');
    if (await bar.isVisible().catch(() => false)) {
      await bar.locator('select[name="action"]').selectOption("counter");
      await bar.locator('input[name="proposedPrice"]').fill("1500");
      const currencyField = bar.locator(
        'select[name="currency"], input[name="currency"]'
      );
      if (await currencyField.evaluate((el) => el.tagName === "SELECT")) {
        await currencyField.selectOption("USD");
      } else if (await currencyField.isVisible().catch(() => false)) {
        await currencyField.fill("USD");
      }
      await bar.locator('input[name="quantity"]').fill("1");
      await bar.getByRole("button", { name: /submit|entry|تسجيل/i }).click();
      await expect(
        bar.getByRole("status").or(bar.locator("p.text-ro-muted"))
      ).toBeVisible({
        timeout: 15_000,
      });
    }
  });

  test("admin deal view exposes reject in negotiation form", async ({ page }) => {
    await loginAdmin(page);
    await page.goto("/admin/deals?lang=en");
    const dealLink = page.locator('a[href^="/admin/deals/"]').first();
    await expect(dealLink, "admin deals list (db:seed)").toBeVisible({
      timeout: 15_000,
    });
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
    expect(
      foreign,
      "foreign trader deal fixture (ensure-seed / db:seed)"
    ).toBeTruthy();
    if (!foreign) return;

    expect(
      foreign.ownerEmail,
      "foreign deal must not belong to login trader"
    ).not.toBe(email);

    await loginTrader(page);
    const res = await page.goto(`/trader/deals/${foreign.id}?lang=en`);
    const body = await page.locator("body").innerText();
    const showsForeignRef = body.includes(foreign.reference);
    const showsNegotiation =
      (await page.locator('[data-component="negotiation-action-bar"]').count()) >
      0;
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
