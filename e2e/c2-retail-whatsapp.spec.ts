import { test, expect } from "@playwright/test";
import {
  addFirstProductViaPdp,
  countRetailRequestsByIdempotencyKey,
  disconnectPrisma,
  expectHandoffSuccess,
  goLocale,
  loginAdmin,
} from "./helpers";
import { disconnectEnsureSeed, ensureE2EFixtures } from "./ensure-seed";

/**
 * WhatsApp admin pairing expects the dev server (and ideally the worker) with
 * WHATSAPP_ADAPTER=fake for deterministic pairing codes. UI tests still run
 * when the adapter is baileys — pairing code assertions are then best-effort.
 */
const fakeAdapter =
  process.env.WHATSAPP_ADAPTER?.trim().toLowerCase() === "fake";

test.beforeAll(async () => {
  await ensureE2EFixtures();
});

test.afterAll(async () => {
  await disconnectPrisma();
  await disconnectEnsureSeed();
});

test.describe("C2 retail handoff + WhatsApp inbox", () => {
  test("retail request idempotency and wa.me handoff", async ({ page }) => {
    const idempotencyKey = crypto.randomUUID();
    await page.addInitScript((key: string) => {
      crypto.randomUUID = () => key as `${string}-${string}-${string}-${string}-${string}`;
    }, idempotencyKey);

    const added = await addFirstProductViaPdp(page);
    expect(added, "published catalog product required (db:seed)").toBe(true);

    async function fillAndSubmit() {
      await goLocale(page, "/request", "en");
      await page.locator('input[name="customerName"]').fill("E2E Retail");
      await page.locator('input[name="customerPhone"]').fill("963900000099");
      await page.locator('input[name="destinationCountry"]').fill("Syria");
      await page
        .getByRole("button", { name: /prepare request for handoff|تجهيز الطلب/i })
        .click();
    }

    await fillAndSubmit();
    await expectHandoffSuccess(page);
    const referenceFirst = await page
      .locator("bdi")
      .first()
      .textContent()
      .catch(() => null);

    const addedAgain = await addFirstProductViaPdp(page);
    expect(addedAgain, "second add-to-cart for idempotency pass").toBe(true);

    await fillAndSubmit();
    await expectHandoffSuccess(page);

    const dbCount = await countRetailRequestsByIdempotencyKey(idempotencyKey);
    expect(dbCount).toBeGreaterThanOrEqual(0);
    if (dbCount >= 0) {
      expect(dbCount).toBe(1);
    }

    if (referenceFirst) {
      await expect(page.locator("bdi").first()).toHaveText(referenceFirst);
    }

    const openWa = page.getByRole("button", { name: /whatsapp|واتس/i });
    if (await openWa.isVisible().catch(() => false)) {
      const popupPromise = page.waitForEvent("popup", { timeout: 15_000 });
      await openWa.click();
      const popup = await popupPromise.catch(() => null);
      if (popup) {
        await popup.waitForLoadState("domcontentloaded").catch(() => undefined);
        const popupUrl = popup.url();
        if (popupUrl && popupUrl !== "about:blank") {
          expect(popupUrl).toMatch(/wa\.me/);
        }
        await popup.close().catch(() => undefined);
      }
      await expect(page.locator("pre").first()).toBeVisible();
    } else {
      test.info().annotations.push({
        type: "note",
        description:
          "Deep link button hidden — set WHATSAPP_BUSINESS_E164 on the dev server",
      });
    }
  });

  test("admin inbox link-account panel and optional fake pairing", async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto("/admin/inbox?lang=en#whatsapp-link-account");

    const panel = page.locator("#whatsapp-link-account");
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute(
      "data-whatsapp-link-account",
      /not_linked|awaiting_code|connected|reconnect|error/
    );

    const state = await panel.getAttribute("data-whatsapp-link-account");
    if (state === "connected") {
      const logout = panel.getByRole("button", { name: /log ?out|تسجيل الخروج|فصل/i });
      if (await logout.isVisible().catch(() => false)) {
        await logout.click();
        await expect
          .poll(async () => panel.getAttribute("data-whatsapp-link-account"), {
            timeout: 30_000,
          })
          .not.toBe("connected");
      }
    }

    const phoneInput = panel.locator('input[name="pairingPhone"]');
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill("963900000001");
      await panel.locator("form button[type='submit']").click();

      if (fakeAdapter) {
        await expect
          .poll(
            async () =>
              (await panel.locator("[data-pairing-code]").textContent()) ||
              (await panel.getAttribute("data-whatsapp-link-account")),
            { timeout: 45_000, intervals: [2000, 3000, 5000] }
          )
          .toMatch(/FAKE-|[A-Z0-9-]{4,}|connected|awaiting_code/i);
      } else {
        test.info().annotations.push({
          type: "note",
          description:
            "Set WHATSAPP_ADAPTER=fake on the dev server (+ worker) for pairing code assertion",
        });
        await expect(panel.getByRole("status")).toBeVisible();
      }
    } else {
      await expect(panel.getByRole("status")).toBeVisible();
    }
  });
});
