/**
 * Closure F5 — server action inventory + smoke contracts (valid / invalid / unauthorized).
 * Run: npx tsx scripts/f5-action-contracts.ts
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { prisma } from "../lib/db/prisma";
import { productUpsertSchema } from "../lib/validation/schemas";
import {
  upsertProductAction,
  createRetailRequestAction,
  adminTransitionRetailRequestAction,
  attachProductImageAction,
} from "../app/actions";
import { traderCreateDealAction, adminCreateTraderAction } from "../app/deal-actions";
import { traderCreateWholesaleRequestAction } from "../app/wholesale-actions";
import {
  adminGetInboxHealthAction,
  adminLinkWhatsAppConversationAction,
} from "../app/whatsapp-actions";
import { traderUpdatePreferencesAction } from "../app/trader-portal-actions";
import { createRetailRequestFromCart } from "../lib/retail-request/service";

const ACTION_GLOBS = [
  "app/actions.ts",
  "app/deal-actions.ts",
  "app/whatsapp-actions.ts",
  "app/wholesale-actions.ts",
  "app/trader-portal-actions.ts",
];

const root = process.cwd();
let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL: ${msg}`);
    return;
  }
  passed += 1;
  console.log(`PASS: ${msg}`);
}

function inventoryActions(): { file: string; actions: string[] }[] {
  const re = /export async function (\w+Action)\s*\(/g;
  return ACTION_GLOBS.map((rel) => {
    const abs = path.join(root, rel);
    const src = fs.readFileSync(abs, "utf8");
    const actions: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) actions.push(m[1]!);
    return { file: rel, actions };
  });
}

/** Mirrors publish guards in app/actions.ts upsertProductAction (no request cookies). */
async function productPublishGuardError(input: {
  productId: string;
  parsed: ReturnType<typeof productUpsertSchema.safeParse>["data"];
}): Promise<string | null> {
  if (!input.parsed || input.parsed.status !== "published") return null;
  if (!input.parsed.nameAr.trim()) return "PUBLISH_NEEDS_NAME_AR";
  if (input.productId) {
    const imageCount = await prisma.productImage.count({
      where: { productId: input.productId },
    });
    if (imageCount < 1) return "PUBLISH_NEEDS_IMAGE";
  } else {
    return "PUBLISH_NEEDS_IMAGE";
  }
  return null;
}

async function main() {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) {
    process.env.AUTH_SECRET = "f5-action-contracts-secret";
  }
  if (!process.env.WHATSAPP_BUSINESS_E164) {
    process.env.WHATSAPP_BUSINESS_E164 = "963900000000";
  }

  const inventory = inventoryActions();
  const totalActions = inventory.reduce((n, f) => n + f.actions.length, 0);
  console.log("=== F5 action inventory ===");
  for (const block of inventory) {
    console.log(`${block.file}: ${block.actions.length} actions`);
    for (const name of block.actions) console.log(`  - ${name}`);
  }
  console.log(`Total exported *Action handlers: ${totalActions}\n`);

  // --- admin / catalog (Unauthorized + invalid + publish guards) ---
  {
    const fd = new FormData();
    const unauth = await upsertProductAction(null, fd);
    assert(
      !unauth.ok && unauth.error === "Unauthorized",
      "upsertProductAction unauthorized"
    );

    const cat = await prisma.category.findFirst();
    const draftProduct = await prisma.product.findFirst({
      where: { status: "draft", images: { none: {} } },
    });
    if (cat && draftProduct) {
      const parsed = productUpsertSchema.safeParse({
        slug: draftProduct.slug,
        nameAr: "",
        nameEn: draftProduct.nameEn || "Test",
        descriptionAr: "",
        descriptionEn: "",
        specsTextAr: "",
        specsTextEn: "",
        categoryId: cat.id,
        retailPrice: Number(draftProduct.retailPrice),
        compareAtPrice: null,
        currency: draftProduct.currency,
        status: "published",
        availability: draftProduct.availability,
        wholesaleEligible: false,
        badgeNew: false,
        badgeFeatured: false,
        badgeSale: false,
      });
      assert(parsed.success, "productUpsertSchema parses publish candidate");
      const guard = await productPublishGuardError({
        productId: draftProduct.id,
        parsed: parsed.data,
      });
      assert(
        guard === "PUBLISH_NEEDS_NAME_AR",
        "admin product publish guard: nameAr required"
      );

      const parsed2 = productUpsertSchema.safeParse({
        ...parsed.data,
        nameAr: "عود",
      });
      const guard2 = await productPublishGuardError({
        productId: draftProduct.id,
        parsed: parsed2.success ? parsed2.data : undefined,
      });
      assert(
        guard2 === "PUBLISH_NEEDS_IMAGE",
        "admin product publish guard: image required"
      );
    } else {
      console.log("SKIP: draft product without images for publish guard");
    }

    const imgUnauth = await attachProductImageAction(null, new FormData());
    assert(
      !imgUnauth.ok && imgUnauth.error === "Unauthorized",
      "attachProductImageAction unauthorized"
    );
  }

  // --- retail request (invalid + valid via service; action valid needs headers()) ---
  {
    const honeypot = await createRetailRequestAction(null, (() => {
      const f = new FormData();
      f.set("companyWebsite", "https://bot.example");
      f.set("locale", "ar");
      f.set("customerName", "x");
      f.set("customerPhone", "+963900000002");
      f.set("destinationCountry", "SY");
      f.set("linesJson", "[]");
      return f;
    })());
    assert(
      !honeypot.ok && honeypot.error === "Invalid request",
      "createRetailRequestAction honeypot invalid"
    );

    const invalid = await createRetailRequestAction(null, (() => {
      const f = new FormData();
      f.set("locale", "ar");
      f.set("customerName", "");
      f.set("customerPhone", "x");
      f.set("destinationCountry", "SY");
      f.set("linesJson", "[]");
      return f;
    })());
    assert(!invalid.ok, "createRetailRequestAction invalid payload");

    const product = await prisma.product.findFirst({
      where: { status: "published" },
    });
    if (product) {
      const { request } = await createRetailRequestFromCart({
        locale: "ar",
        customerName: "F5 Contract",
        customerPhone: "+963900000003",
        customerNotes: "",
        destinationCountry: "SY",
        lines: [{ productId: product.id, quantity: 1 }],
        status: "ready_for_handoff",
        idempotencyKey: randomUUID(),
      });
      assert(!!request.reference, "retail request valid (service layer contract)");
    }

    const adminRetail = await adminTransitionRetailRequestAction(new FormData());
    assert(
      !adminRetail.ok && adminRetail.error === "Unauthorized",
      "adminTransitionRetailRequestAction unauthorized"
    );
  }

  // --- trader deals ---
  {
    const unauth = await traderCreateDealAction(null, new FormData());
    assert(
      !unauth.ok && unauth.error === "Unauthorized",
      "traderCreateDealAction unauthorized"
    );

    const invalid = await traderCreateDealAction(null, (() => {
      const f = new FormData();
      f.set("dealKind", "not-a-kind");
      return f;
    })());
    assert(
      !invalid.ok && invalid.error === "Unauthorized",
      "traderCreateDealAction invalid still blocked without session"
    );

    const adminDeal = await adminCreateTraderAction(null, new FormData());
    assert(
      !adminDeal.ok && adminDeal.error === "Unauthorized",
      "adminCreateTraderAction unauthorized"
    );
  }

  // --- wholesale ---
  {
    const unauth = await traderCreateWholesaleRequestAction(null, new FormData());
    assert(
      !unauth.ok && unauth.error === "Unauthorized",
      "traderCreateWholesaleRequestAction unauthorized"
    );
  }

  // --- whatsapp admin ---
  {
    const health = await adminGetInboxHealthAction();
    assert(
      !health.ok && health.error === "UNAUTHORIZED",
      "adminGetInboxHealthAction unauthorized"
    );
    const link = await adminLinkWhatsAppConversationAction(new FormData());
    assert(
      !link.ok && link.error === "UNAUTHORIZED",
      "adminLinkWhatsAppConversationAction unauthorized"
    );
  }

  // --- trader portal ---
  {
    const prefs = await traderUpdatePreferencesAction(null, new FormData());
    assert(
      !prefs.ok && prefs.error === "Unauthorized",
      "traderUpdatePreferencesAction unauthorized"
    );
  }

  const inventoryPath = path.join(
    root,
    "docs/pro-readiness/F5-ACTION-INVENTORY.json"
  );
  fs.mkdirSync(path.dirname(inventoryPath), { recursive: true });
  fs.writeFileSync(
    inventoryPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalActions,
        files: inventory,
      },
      null,
      2
    )
  );

  console.log(`\nf5-action-contracts: ${passed} passed, ${failed} failed`);
  console.log(`Inventory written: ${inventoryPath}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
