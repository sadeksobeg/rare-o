/**
 * Unit checks for WhatsApp private media store (no DB / no Baileys).
 */
import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";

import {
  isSafeWhatsAppMediaFileName,
  parseStorageKey,
  readWhatsAppMediaByKey,
  saveWhatsAppMediaBytes,
  whatsappUploadsRoot,
} from "../lib/whatsapp/media";

async function main() {
  const conversationId = `testconv${Date.now()}`;
  const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xd9, 0x00, 0x01, 0x02, 0x03]);

  const saved = await saveWhatsAppMediaBytes({
    conversationId,
    bytes,
    mime: "image/jpeg",
    kind: "image",
  });
  assert.equal(saved.ok, true, "save ok");
  if (!saved.ok) throw new Error("save failed");

  assert.ok(isSafeWhatsAppMediaFileName(saved.saved.fileName));
  const parsed = parseStorageKey(saved.saved.storageKey);
  assert.ok(parsed);
  assert.equal(parsed!.conversationId, conversationId);

  const read = await readWhatsAppMediaByKey(saved.saved.storageKey);
  assert.ok(read);
  assert.equal(read!.equals(bytes), true);

  const bad = parseStorageKey("../etc/passwd");
  assert.equal(bad, null);

  await rm(path.join(whatsappUploadsRoot(), conversationId), {
    recursive: true,
    force: true,
  });

  console.log("PASS: whatsapp-media-store-checks");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
