import { test, expect } from "@playwright/test";

test.describe("storefront smoke", () => {
  test("home loads AR", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("catalog loads", async ({ page }) => {
    await page.goto("/catalog");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("health endpoint", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
