/**
 * WA-W2 checks — media validation, quick-reply fill, desk gates,
 * phone privacy, magic bytes, voice convert, hide-for-me, templates.
 * No real WhatsApp sends.
 *
 * Run: npx tsx scripts/whatsapp-w2-checks.ts
 */

import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import {
  fillQuickReplyVariables,
  ensureDefaultQuickReplies,
  listQuickReplyTemplates,
  upsertQuickReplyTemplate,
  deleteQuickReplyTemplate,
} from "@/lib/whatsapp/messaging/quick-replies";
import {
  hideMessageForMe,
  markConversationUnread,
  revealConversationPhone,
  setConversationArchived,
  setConversationBlocked,
  setConversationMuted,
} from "@/lib/whatsapp/messaging/desk-actions";
import {
  maxBytesForMediaKind,
  mediaKindFromMime,
  normalizeOutboundMime,
  WHATSAPP_MAX_IMAGE_BYTES,
  WHATSAPP_MAX_DOCUMENT_BYTES,
} from "@/lib/whatsapp/media-shared";
import { detectWhatsAppMediaMagic } from "@/lib/whatsapp/media-magic";
import {
  isSafeWhatsAppMediaFileName,
  saveWhatsAppMediaBytes,
} from "@/lib/whatsapp/media";
import {
  isSafeWhatsAppConversationId,
  resolveWhatsAppServeContentType,
} from "@/lib/whatsapp/media-serve";
import { getInboxConversation } from "@/lib/whatsapp/messaging/inbox";
import { convertVoiceNoteToOggOpus } from "@/lib/whatsapp/messaging/voice-convert";
import {
  enqueueOutboundMedia,
  enqueueOutboundText,
} from "@/lib/whatsapp/messaging/service";
import { clearEnqueueRateLimitForTests } from "@/lib/whatsapp/messaging/enqueue-rate-limit";
import { primeOutboundKillSwitch } from "@/lib/whatsapp/types";
import { setOutboundKillSwitch } from "@/lib/whatsapp/messaging/outbound-kill-switch";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT: ${msg}`);
}

/** Minimal JPEG SOI + padding so magic sniff (≥12 bytes) succeeds. */
function tinyJpeg(): Buffer {
  const buf = Buffer.alloc(16, 0);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  buf[3] = 0xd9;
  return buf;
}

function runOfflineChecks() {
  console.log("[w2] media limits");
  assert(maxBytesForMediaKind("image") === WHATSAPP_MAX_IMAGE_BYTES, "image 10MB");
  assert(maxBytesForMediaKind("document") === WHATSAPP_MAX_DOCUMENT_BYTES, "doc 25MB");
  assert(mediaKindFromMime("image/jpeg") === "image", "jpeg kind");
  assert(normalizeOutboundMime("audio/webm;codecs=opus") === "audio/webm", "mime strip");

  console.log("[w2] magic bytes");
  const jpeg = tinyJpeg();
  assert(detectWhatsAppMediaMagic(jpeg)?.mime === "image/jpeg", "jpeg magic");
  assert(detectWhatsAppMediaMagic(Buffer.from("%PDF-1.4...."))?.kind === "document", "pdf magic");
  assert(detectWhatsAppMediaMagic(Buffer.from("not-media!!!!")) === null, "reject garbage");
  assert(isSafeWhatsAppMediaFileName("1700000000000-abcdef012345.jpg"), "safe name");
  assert(!isSafeWhatsAppMediaFileName("../secret.jpg"), "reject traversal name");
  assert(!isSafeWhatsAppMediaFileName("..%2fsecret.jpg"), "reject encoded traversal name");
  assert(!isSafeWhatsAppMediaFileName("a.jpg"), "reject guessable short name");
  assert(isSafeWhatsAppConversationId("clxyz0123456789abcdefghi"), "safe conv id");
  assert(!isSafeWhatsAppConversationId("../etc"), "reject conv traversal");
  assert(!isSafeWhatsAppConversationId("a/b"), "reject conv slash");

  console.log("[w2] download headers (magic + nosniff-safe)");
  const jpegServe = resolveWhatsAppServeContentType(
    tinyJpeg(),
    "image/jpeg",
    "1700000000000-abcdef012345.jpg"
  );
  assert(jpegServe.contentType === "image/jpeg", "jpeg content-type from magic");
  assert(jpegServe.disposition.startsWith("inline"), "jpeg inline disposition");
  const htmlSpoof = resolveWhatsAppServeContentType(
    Buffer.from("<!DOCTYPE html><html><script>alert(1)</script></html>"),
    "text/html",
    "1700000000000-abcdef012345.html"
  );
  assert(
    htmlSpoof.contentType === "application/octet-stream",
    "html forced to octet-stream"
  );
  assert(htmlSpoof.disposition.startsWith("attachment"), "html attachment only");
  const pdfServe = resolveWhatsAppServeContentType(
    Buffer.from("%PDF-1.4............"),
    "application/pdf",
    "1700000000000-abcdef012345.pdf"
  );
  assert(pdfServe.contentType === "application/pdf", "pdf magic type");
  assert(pdfServe.disposition.includes("filename="), "disposition has filename");

  console.log("[w2] quick reply variables");
  const filled = fillQuickReplyVariables("مرحباً {name} — {request_ref}", {
    name: "أحمد",
    requestRef: "RO-100",
  });
  assert(filled.includes("أحمد") && filled.includes("RO-100"), "vars filled");
  console.log("[w2] offline OK");
}

async function makeRealOpusSample(): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "wa-w2-opus-"));
  const out = path.join(dir, "sample.ogg");
  try {
    const r = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-f",
        "lavfi",
        "-i",
        "anullsrc=r=48000:cl=mono",
        "-t",
        "0.25",
        "-c:a",
        "libopus",
        "-b:a",
        "24k",
        "-f",
        "ogg",
        out,
      ],
      { encoding: "utf8", windowsHide: true }
    );
    assert(r.status === 0, `ffmpeg sample failed: ${r.stderr?.slice(-300)}`);
    return await readFile(out);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function main() {
  const offlineOnly =
    process.argv.includes("--offline") || process.env.WA_W2_OFFLINE === "1";

  runOfflineChecks();
  if (offlineOnly) {
    console.log("[w2] OK (offline only — DB section skipped)");
    return;
  }

  const prevOutbound = process.env.WHATSAPP_OUTBOUND_ENABLED;
  process.env.WHATSAPP_OUTBOUND_ENABLED = "true";
  primeOutboundKillSwitch(false);
  clearEnqueueRateLimitForTests();

  const suffix = randomUUID().slice(0, 8);
  const phoneDigits = `9647200${suffix.slice(0, 6)}`;
  const waChatId = `${phoneDigits}@s.whatsapp.net`;
  const adminId = `w2-admin-${suffix}`;

  console.log("[w2] seed conversation");
  const conversation = await prisma.whatsAppConversation.create({
    data: {
      waChatId,
      remoteJid: waChatId,
      displayName: `W2 ${suffix}`,
      lastMessageAt: new Date(),
      lastMessagePreview: "seed",
      unreadCount: 0,
      participantE164: phoneDigits,
    },
  });

  try {
    console.log("[w2] phone privacy (masked DTO + audited reveal)");
    const detail = await getInboxConversation(conversation.id);
    assert(detail, "detail loaded");
    assert(detail!.hasPhone === true, "hasPhone");
    assert(detail!.participantE164?.includes("••") === true, "dto masked");
    assert(
      detail!.participantE164 !== phoneDigits &&
        detail!.participantE164 !== `+${phoneDigits}`,
      "participantE164 is not full number"
    );
    const revealed = await revealConversationPhone(conversation.id, adminId);
    assert(revealed.ok && revealed.phone === phoneDigits, "reveal returns full");
    const audits = await prisma.whatsAppPhoneRevealAudit.count({
      where: { conversationId: conversation.id, adminId },
    });
    assert(audits >= 1, "reveal audited");

    console.log("[w2] magic reject spoofed extension");
    const spoof = await saveWhatsAppMediaBytes({
      conversationId: conversation.id,
      bytes: Buffer.from("this is not a jpeg!!!!!!"),
      mime: "image/jpeg",
      kind: "image",
      originalName: "evil.jpg",
    });
    assert(!spoof.ok && spoof.error === "BAD_MAGIC", "spoof rejected");

    console.log("[w2] templates");
    await ensureDefaultQuickReplies(adminId);
    const listed = await listQuickReplyTemplates("ar");
    assert(listed.length >= 3, "defaults seeded");
    const created = await upsertQuickReplyTemplate({
      titleAr: "اختبار",
      titleEn: "Test",
      bodyAr: "نص {name}",
      bodyEn: "Hi {name}",
      adminId,
      sortOrder: 99,
    });
    assert(created.ok, "create template");
    if (created.ok) {
      const del = await deleteQuickReplyTemplate(created.id);
      assert(del.ok, "delete template");
    }

    console.log("[w2] desk actions + server send gates");
    assert((await markConversationUnread(conversation.id)).ok, "unread");
    const afterUnread = await prisma.whatsAppConversation.findUnique({
      where: { id: conversation.id },
    });
    assert((afterUnread?.unreadCount ?? 0) >= 1, "unreadCount>=1");

    assert(
      (await setConversationMuted(conversation.id, new Date(Date.now() + 3600_000))).ok,
      "mute"
    );
    clearEnqueueRateLimitForTests();
    const mutedSend = await enqueueOutboundText({
      waChatId,
      text: "muted",
      clientRequestId: randomUUID(),
      adminId,
      allowCreateConversation: false,
    });
    assert(
      !mutedSend.ok && mutedSend.code === "OUTBOUND_DISABLED",
      "mute gates outbound"
    );
    assert((await setConversationMuted(conversation.id, null)).ok, "unmute");

    assert((await setConversationArchived(conversation.id, true)).ok, "archive");
    clearEnqueueRateLimitForTests();
    const archivedSend = await enqueueOutboundText({
      waChatId,
      text: "archived",
      clientRequestId: randomUUID(),
      adminId,
      allowCreateConversation: false,
    });
    assert(
      !archivedSend.ok && archivedSend.code === "OUTBOUND_DISABLED",
      "archive gates outbound"
    );
    assert((await setConversationArchived(conversation.id, false)).ok, "unarchive");

    assert((await setConversationBlocked(conversation.id, true, adminId)).ok, "block");
    clearEnqueueRateLimitForTests();
    const blockedSend = await enqueueOutboundText({
      waChatId,
      text: "blocked",
      clientRequestId: randomUUID(),
      adminId,
      allowCreateConversation: false,
    });
    assert(
      !blockedSend.ok && blockedSend.code === "OUTBOUND_DISABLED",
      "block gates outbound"
    );
    assert((await setConversationBlocked(conversation.id, false, adminId)).ok, "unblock");

    console.log("[w2] kill switch + media enqueue");
    await setOutboundKillSwitch(true, "CONNECTED", { by: adminId });
    const killedMedia = await enqueueOutboundMedia({
      waChatId,
      clientRequestId: randomUUID(),
      adminId,
      messageType: "image",
      bytes: tinyJpeg(),
      mime: "image/jpeg",
      fileName: "x.jpg",
    });
    assert(
      !killedMedia.ok && killedMedia.code === "OUTBOUND_DISABLED",
      "kill blocks media"
    );
    await setOutboundKillSwitch(false, "CONNECTED", { by: adminId });
    clearEnqueueRateLimitForTests();

    const media = await enqueueOutboundMedia({
      waChatId,
      clientRequestId: randomUUID(),
      adminId,
      messageType: "image",
      bytes: tinyJpeg(),
      mime: "image/jpeg",
      fileName: "w2.jpg",
      caption: "cap",
      isPtt: false,
    });
    assert(media.ok && !media.duplicate, "media enqueue");

    console.log("[w2] voice convert (ffmpeg → ogg/opus)");
    const opusSample = await makeRealOpusSample();
    const converted = await convertVoiceNoteToOggOpus(opusSample, {
      inputMime: "audio/ogg",
    });
    assert(converted.ok, "convert ok");
    if (converted.ok) {
      assert(converted.mime === "audio/ogg", "ogg mime");
      assert(converted.bytes.length > 0, "ogg bytes");
    }

    // Generate a non-opus webm-like path: re-encode via wav then convert
    const dir = await mkdtemp(path.join(tmpdir(), "wa-w2-wav-"));
    const wav = path.join(dir, "a.wav");
    try {
      const r = spawnSync(
        "ffmpeg",
        [
          "-y",
          "-f",
          "lavfi",
          "-i",
          "anullsrc=r=44100:cl=mono",
          "-t",
          "0.2",
          wav,
        ],
        { encoding: "utf8", windowsHide: true }
      );
      assert(r.status === 0, "wav sample");
      const wavBytes = await readFile(wav);
      const fromWav = await convertVoiceNoteToOggOpus(wavBytes, {
        inputMime: "audio/wav",
        force: true,
      });
      assert(fromWav.ok && !fromWav.skipped, "wav→opus converted");
    } finally {
      await rm(dir, { recursive: true, force: true }).catch(() => undefined);
    }

    const voiceId = randomUUID();
    clearEnqueueRateLimitForTests();
    await new Promise((r) => setTimeout(r, 1100));
    const voice = await enqueueOutboundMedia({
      waChatId,
      clientRequestId: voiceId,
      adminId,
      messageType: "audio",
      bytes: opusSample,
      mime: "audio/ogg",
      fileName: "note.ogg",
      isPtt: true,
      mediaDurationSec: 3,
    });
    assert(voice.ok, "voice enqueue");
    const voiceRow = await prisma.whatsAppMessage.findUnique({
      where: { id: voice.messageId },
    });
    assert(voiceRow?.isPtt === true, "isPtt flag");

    const dup = await enqueueOutboundMedia({
      waChatId,
      clientRequestId: voiceId,
      adminId,
      messageType: "audio",
      bytes: opusSample,
      mime: "audio/ogg",
      fileName: "note.ogg",
      isPtt: true,
    });
    assert(dup.ok && dup.duplicate, "media idempotent");

    console.log("[w2] hide-for-me");
    assert((await hideMessageForMe(voice.messageId)).ok, "hide");
    const hidden = await prisma.whatsAppMessage.findUnique({
      where: { id: voice.messageId },
    });
    assert(hidden?.hiddenAt != null, "hiddenAt set");

    console.log("[w2] OK");
  } finally {
    await prisma.whatsAppMessage.deleteMany({
      where: { conversationId: conversation.id },
    });
    await prisma.whatsAppComposerDraft.deleteMany({
      where: { conversationId: conversation.id },
    });
    await prisma.whatsAppPhoneRevealAudit.deleteMany({
      where: { conversationId: conversation.id },
    });
    await prisma.whatsAppQuickReplyTemplate.deleteMany({
      where: { createdByAdminId: adminId },
    }).catch(() => undefined);
    await prisma.whatsAppConversation.delete({ where: { id: conversation.id } });
    await setOutboundKillSwitch(false).catch(() => undefined);
    if (prevOutbound === undefined) delete process.env.WHATSAPP_OUTBOUND_ENABLED;
    else process.env.WHATSAPP_OUTBOUND_ENABLED = prevOutbound;
    await prisma.$disconnect();
  }
}

main().catch(async (err) => {
  console.error("[w2] FAIL", err);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
