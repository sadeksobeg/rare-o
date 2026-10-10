/**
 * Phase A checks — adapter boundary, session store, kill switch.
 * Does NOT open a Baileys socket or authenticate WhatsApp.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { BaileysWhatsAppAdapter } from "../lib/whatsapp/baileys-adapter";
import { normalizeUserJid, toE164Digits } from "../lib/whatsapp/jid";
import {
  assertAuthDirNotPublic,
  ensureAuthDir,
  hasAuthStateFiles,
  resolveWhatsAppAuthDir,
} from "../lib/whatsapp/session-store";
import { isOutboundEnabled } from "../lib/whatsapp/types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

async function main(): Promise<void> {
  // --- session store ---
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rare-oud-wa-auth-"));
  try {
    ensureAuthDir(tmp);
    assert(fs.existsSync(tmp), "ensureAuthDir creates directory");
    assert(!hasAuthStateFiles(tmp), "empty auth dir has no creds");

    let threw = false;
    try {
      assertAuthDirNotPublic(path.join(process.cwd(), "public", "wa-auth"));
    } catch {
      threw = true;
    }
    assert(threw, "assertAuthDirNotPublic rejects public/");

    const resolved = resolveWhatsAppAuthDir(process.cwd());
    assert(
      resolved.endsWith(`${path.sep}.wa-auth`) || resolved.endsWith("/.wa-auth"),
      "default auth dir is .wa-auth"
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  // --- jid helpers ---
  assert(toE164Digits("+963 900 000 000") === "963900000000", "e164 digits");
  assert(
    normalizeUserJid("963900000000") === "963900000000@s.whatsapp.net",
    "normalize digits to jid"
  );
  assert(normalizeUserJid("someone@g.us") === null, "reject group jid");

  // --- kill switch default off ---
  const prev = process.env.WHATSAPP_OUTBOUND_ENABLED;
  delete process.env.WHATSAPP_OUTBOUND_ENABLED;
  assert(isOutboundEnabled() === false, "outbound default false");
  process.env.WHATSAPP_OUTBOUND_ENABLED = "true";
  assert(isOutboundEnabled() === true, "outbound true");
  process.env.WHATSAPP_OUTBOUND_ENABLED = "false";
  assert(isOutboundEnabled() === false, "outbound false");
  if (prev === undefined) delete process.env.WHATSAPP_OUTBOUND_ENABLED;
  else process.env.WHATSAPP_OUTBOUND_ENABLED = prev;

  // --- adapter start without connect (no socket / no QR) ---
  const authTmp = fs.mkdtempSync(path.join(os.tmpdir(), "rare-oud-wa-adapter-"));
  try {
    const adapter = new BaileysWhatsAppAdapter({
      session: { authDir: authTmp },
      connectOnStart: false,
    });
    await adapter.start();
    const health = adapter.getHealth();
    assert(
      health.state === "AUTHENTICATION_REQUIRED" || health.state === "DISCONNECTED",
      `idle start health got ${health.state}`
    );

    process.env.WHATSAPP_OUTBOUND_ENABLED = "true";
    const send = await adapter.sendText({
      waChatId: "963900000000",
      text: "should not send",
      clientRequestId: "phase-a-check-1",
      adminId: "test-admin",
    });
    assert(send.ok === false && send.code === "NOT_CONNECTED", "send blocked when disconnected");

    process.env.WHATSAPP_OUTBOUND_ENABLED = "false";
    const send2 = await adapter.sendText({
      waChatId: "963900000000",
      text: "should not send",
      clientRequestId: "phase-a-check-2",
      adminId: "test-admin",
    });
    assert(
      send2.ok === false && send2.code === "OUTBOUND_DISABLED",
      "send blocked by kill switch"
    );

    await adapter.stop();
  } finally {
    fs.rmSync(authTmp, { recursive: true, force: true });
    if (prev === undefined) delete process.env.WHATSAPP_OUTBOUND_ENABLED;
    else process.env.WHATSAPP_OUTBOUND_ENABLED = prev;
  }

  // Confirm Baileys package pin resolves
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pkg = require("@whiskeysockets/baileys/package.json") as {
    version: string;
  };
  assert(pkg.version === "6.7.24", `Baileys pin is 6.7.24 (got ${pkg.version})`);

  console.log("Phase A checks: PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
