import { test, expect } from "@playwright/test";

test.describe("V1 motion lab", () => {
  test.skip(({ browserName }) => browserName !== "chromium");

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("lab content is visible and tier is Lite", async ({ page }) => {
      const res = await page.goto("/dev/ui", { waitUntil: "domcontentloaded" });
      if (res?.status() === 404) test.skip();

      await expect(page.locator("#motion-lab")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId("motion-sampler")).toBeVisible();
      await expect(page.getByTestId("motion-badge")).toBeVisible();

      await expect
        .poll(async () =>
          page.locator("#motion-lab").evaluate((el) => {
            const host = el.closest("[data-ro-motion-tier]");
            return host?.getAttribute("data-ro-motion-tier") ?? "";
          })
        )
        .toBe("Lite");

      const duration = await page
        .locator("#motion-lab")
        .evaluate((el) =>
          getComputedStyle(el).getPropertyValue("--ro-dur-ripple").trim()
        );
      expect(["1ms", "0.001s"]).toContain(duration);

      await page.getByRole("button", { name: /add to request|أضف إلى الطلب/i }).click();
      await expect(page.getByTestId("motion-badge")).toContainText("1");
    });
  });
});
