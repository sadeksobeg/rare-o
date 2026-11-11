/**
 * Convert recorded voice notes to Ogg/Opus for WhatsApp PTT.
 * Requires `ffmpeg` on PATH (added to the production worker image).
 */
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export type VoiceConvertResult =
  | { ok: true; bytes: Buffer; mime: "audio/ogg"; skipped: false }
  | { ok: true; bytes: Buffer; mime: string; skipped: true; reason: string }
  | { ok: false; error: string };

function looksLikeOggOpus(buf: Buffer): boolean {
  if (buf.length < 36) return false;
  if (buf.toString("ascii", 0, 4) !== "OggS") return false;
  // OpusHead usually appears in the first logical page
  return buf.includes(Buffer.from("OpusHead"));
}

export async function convertVoiceNoteToOggOpus(
  input: Buffer,
  opts?: { inputMime?: string; force?: boolean }
): Promise<VoiceConvertResult> {
  if (!input.length) return { ok: false, error: "EMPTY" };

  const mime = (opts?.inputMime || "").toLowerCase();
  if (!opts?.force && looksLikeOggOpus(input)) {
    return { ok: true, bytes: input, mime: "audio/ogg", skipped: true, reason: "already-ogg-opus" };
  }

  const dir = await mkdtemp(path.join(tmpdir(), "wa-ptt-"));
  const id = randomBytes(4).toString("hex");
  const inExt =
    mime.includes("webm") ? "webm" : mime.includes("ogg") ? "ogg" : mime.includes("mp4") || mime.includes("m4a") ? "m4a" : "bin";
  const inPath = path.join(dir, `in-${id}.${inExt}`);
  const outPath = path.join(dir, `out-${id}.ogg`);

  try {
    await writeFile(inPath, input);
    await runFfmpeg([
      "-y",
      "-i",
      inPath,
      "-vn",
      "-c:a",
      "libopus",
      "-b:a",
      "32k",
      "-ac",
      "1",
      "-ar",
      "48000",
      "-f",
      "ogg",
      outPath,
    ]);
    const bytes = await readFile(outPath);
    if (!bytes.length || !looksLikeOggOpus(bytes)) {
      return { ok: false, error: "FFMPEG_BAD_OUTPUT" };
    }
    return { ok: true, bytes, mime: "audio/ogg", skipped: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/ENOENT|ffmpeg/i.test(msg) && /not found|ENOENT/i.test(msg)) {
      return { ok: false, error: "FFMPEG_MISSING" };
    }
    return { ok: false, error: msg.slice(0, 200) };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, {
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true,
    });
    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
      if (stderr.length > 4000) stderr = stderr.slice(-4000);
    });
    child.on("error", (err) => reject(err));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-500)}`));
    });
  });
}
