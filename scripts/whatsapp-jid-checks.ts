/**
 * Unit checks for LID-safe JID / E.164 helpers.
 */
import assert from "node:assert/strict";
import {
  e164FromPnHint,
  e164FromRemoteJid,
  isE164LikelyLidMirror,
  isLidJid,
  normalizeUserJid,
} from "../lib/whatsapp/jid";
import { WhatsAppContactDirectory } from "../lib/whatsapp/contact-directory";

function main() {
  assert.equal(isLidJid("191302842994872@lid"), true);
  assert.equal(e164FromRemoteJid("191302842994872@lid"), null, "LID is not a phone");
  assert.equal(e164FromRemoteJid("963912345678@s.whatsapp.net"), "963912345678");
  assert.equal(e164FromPnHint("963912345678@s.whatsapp.net"), "963912345678");
  assert.equal(normalizeUserJid("963912345678"), "963912345678@s.whatsapp.net");

  assert.equal(
    isE164LikelyLidMirror("191302842994872", "191302842994872@lid"),
    true
  );

  const dir = new WhatsAppContactDirectory();
  dir.upsertContact({
    id: "191302842994872@lid",
    lid: "191302842994872@lid",
    jid: "963912345678@s.whatsapp.net",
    name: "أحمد",
    notify: "Ahmad",
  });
  const id = dir.resolve("191302842994872@lid", { pushName: "Ignored" });
  assert.equal(id.e164, "963912345678");
  assert.equal(id.displayName, "أحمد");

  const fromShare = dir.linkLidToPn(
    "222@lid",
    "96170123456@s.whatsapp.net"
  );
  assert.ok(fromShare);
  assert.equal(fromShare!.e164, "96170123456");

  console.log("PASS: whatsapp-jid-checks");
}

main();
