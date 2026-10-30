import path from "node:path";
import { test, expect } from "@playwright/test";
import {
  deleteTraderByEmail,
  disconnectPrisma,
  goLocale,
  loginAdmin,
} from "./helpers";
import { disconnectEnsureSeed, ensureE2EFixtures } from "./ensure-seed";

const FIXTURES = path.join(__dirname, "fixtures");
const SAMPLE_MP4 = path.join(FIXTURES, "sample-product.mp4");
const SAMPLE_JPG = path.join(FIXTURES, "sample-product.jpg");

test.beforeAll(async () => {
  await ensureE2EFixtures();
});

test.afterAll(async () => {
  await disconnectPrisma();
  await disconnectEnsureSeed();
});

async function expectRouteOk(
  page: import("@playwright/test").Page,
  url: string
) {
  const res = await page.goto(url, { waitUntil: "domcontentloaded" });
  expect(res?.status(), `route ${url}`).not.toBe(404);
}

test.describe("D1 admin media + guards", () => {
  test("create product, media upload, publish rules, category guard", async ({
    page,
  }) => {
    await loginAdmin(page);
    await expectRouteOk(page, "/admin/products/new?lang=en");

    const slug = `e2e-d1-${Date.now()}`;
    await page.goto("/admin/products/new?lang=en");

    await expect(
      page.getByText(/upload images|رفع الصور|after save/i),
      "admin new product UI"
    ).toBeVisible();

    await page.locator('input[name="slug"]').fill(slug);
    await page.locator('input[name="nameEn"]').fill("E2E D1 Product");
    await page.locator('input[name="nameAr"]').fill("");
    await page.locator('input[name="currency"]').fill("USD");
    await page.locator('select[name="status"]').selectOption("draft");
    await page.getByRole("button", { name: /save product|حفظ المنتج/i }).click();
    await page.waitForURL(/\/admin\/products\/[^/]+/, { timeout: 30_000 });

    const fileInput = page.locator('input[type="file"][name="file"]');
    await expect(fileInput, "ImageUploader on edit page").toBeVisible();

    await expect(page.getByText(/no media yet|لا وسائط/i)).toBeVisible();

    const publishSelect = page.locator('select[name="status"]');
    await expect(
      publishSelect.locator('option[value="published"]')
    ).toBeDisabled();

    await page.locator('input[name="nameAr"]').fill("منتج اختبار");
    await page.locator('input[name="nameEn"]').fill("E2E D1 Product");
    await publishSelect.selectOption("published");
    const saveBtn = page.getByRole("button", { name: /save product|حفظ المنتج/i });
    await expect(saveBtn).toBeDisabled();

    await fileInput.setInputFiles(SAMPLE_JPG);
    await page
      .locator("form")
      .filter({ has: fileInput })
      .getByRole("button", { name: /upload|رفع/i })
      .click();
    await expect(page.locator("ul li").first()).toBeVisible({ timeout: 30_000 });

    const slotsLeft = 8 - (await page.locator("ul li").count());
    for (let i = 0; i < Math.min(slotsLeft, 2); i += 1) {
      await fileInput.setInputFiles(SAMPLE_JPG);
      await page
        .locator("form")
        .filter({ has: fileInput })
        .getByRole("button", { name: /upload|رفع/i })
        .click();
      await page.waitForTimeout(500);
    }

    await fileInput.setInputFiles(SAMPLE_MP4);
    await page
      .locator("form")
      .filter({ has: fileInput })
      .getByRole("button", { name: /upload|رفع/i })
      .click();
    await expect(page.locator("video").first()).toBeVisible({ timeout: 30_000 });

    await publishSelect.selectOption("published");
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();
    await page.waitForLoadState("networkidle");

    await goLocale(page, `/product/${slug}`, "en");
    await expect(page.locator("video").first()).toBeVisible({ timeout: 30_000 });
  });

  test("category delete blocked when products exist", async ({ page }) => {
    await loginAdmin(page);
    await expectRouteOk(page, "/admin/categories?lang=en");

    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count, "categories admin table").toBeGreaterThan(0);

    let found = false;
    for (let i = 0; i < count; i += 1) {
      const row = rows.nth(i);
      const productCell = row.locator("td").nth(4);
      const n = parseInt((await productCell.innerText()).replace(/\D/g, ""), 10);
      if (n > 0) {
        found = true;
        const deleteBtn = row.getByRole("button", { name: /delete|حذف/i });
        await expect(deleteBtn).toBeDisabled();
        const title = await deleteBtn.getAttribute("title");
        expect(title?.length).toBeGreaterThan(0);
        break;
      }
    }
    expect(found, "category with products in seed").toBe(true);
  });

  test("create trader shows temp password once", async ({ page }) => {
    await loginAdmin(page);
    await expectRouteOk(page, "/admin/traders?lang=en");

    const form = page.locator("#create-trader form, form").filter({
      has: page.locator('input[name="email"]'),
    });
    await expect(form, "create trader form").toBeVisible();

    const email = `e2e-trader-${Date.now()}@rareoud.test`;
    try {
      await form.locator('input[name="email"]').fill(email);
      await form.locator('input[name="displayName"]').fill("E2E Trader");
      await form
        .getByRole("button", { name: /create trader|إنشاء التاجر/i })
        .click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 30_000 });
      await expect(
        dialog.locator(".font-mono, [dir='ltr']").last()
      ).not.toHaveText("");
      await dialog.getByRole("checkbox").check();
      await dialog.getByRole("button", { name: /close|إغلاق/i }).click();
      await expect(dialog).toBeHidden();
    } finally {
      // Runs even if an assertion above fails, so this test never leaves a
      // trader row behind (previously accumulated as e2e-trader-*@rareoud.test).
      await deleteTraderByEmail(email);
    }
  });

  test("customer detail opens from list", async ({ page }) => {
    await loginAdmin(page);
    await expectRouteOk(page, "/admin/customers?lang=en");

    const viewLink = page.getByRole("link", { name: /view|عرض/i }).first();
    await expect(viewLink, "customers in seed (ensure-seed)").toBeVisible();
    await viewLink.click();
    await page.waitForURL(/\/admin\/customers\/[^/]+/, { timeout: 15_000 });
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});
