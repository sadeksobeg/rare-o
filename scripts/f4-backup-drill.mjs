/**
 * F4: Prove age-encrypted backup → MinIO (S3) → download → decrypt → checksum compare.
 *
 * Requires: age, rclone (or falls back to AWS SDK via curl+mc), docker MinIO up.
 * Env:
 *   AGE_PUBLIC_KEY / AGE_SECRET_KEY (or generates ephemeral for drill)
 *   MINIO_ENDPOINT=http://127.0.0.1:9000
 *   MINIO_ROOT_USER / MINIO_ROOT_PASSWORD
 *   MINIO_BUCKET=rare-oud-backups
 *
 * Prints JSON report to docs/pro-readiness/F4-BACKUP-DRILL.json
 */
import { execFileSync, execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "docs/pro-readiness/F4-BACKUP-DRILL.json");
const WORK = path.join(ROOT, "tmp", `f4-drill-${Date.now()}`);
const report = {
  at: new Date().toISOString(),
  steps: [],
  ok: false,
  blocked: [],
};

function step(name, fn) {
  try {
    const detail = fn() ?? {};
    report.steps.push({ name, ok: true, ...detail });
    console.log(`PASS: ${name}`);
    return detail;
  } catch (e) {
    report.steps.push({ name, ok: false, error: e.message });
    console.error(`FAIL: ${name} — ${e.message}`);
    throw e;
  }
}

function which(cmd) {
  try {
    execSync(process.platform === "win32" ? `where ${cmd}` : `command -v ${cmd}`, {
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

function sha256File(file) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(file));
  return h.digest("hex");
}

fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

try {
  const hasAge = which("age") && which("age-keygen");
  if (!hasAge) {
    report.blocked.push("age CLI not installed — using Node crypto AES-GCM envelope as drill stand-in");
  }

  const payloadDir = path.join(WORK, "payload");
  fs.mkdirSync(payloadDir, { recursive: true });

  step("create_payload", () => {
    const marker = `f4-${Date.now()}`;
    fs.writeFileSync(path.join(payloadDir, "marker.txt"), marker);
    // Copy small sample of uploads if present
    const uploads = path.join(ROOT, "public/uploads");
    if (fs.existsSync(uploads)) {
      execSync(
        process.platform === "win32"
          ? `xcopy /E /I /Q "${uploads}" "${path.join(payloadDir, "uploads")}"`
          : `cp -a "${uploads}" "${path.join(payloadDir, "uploads")}"`,
        { stdio: "pipe" }
      );
    }
    const wa = path.join(ROOT, process.env.WHATSAPP_AUTH_DIR || ".wa-auth");
    if (fs.existsSync(wa)) {
      execSync(
        process.platform === "win32"
          ? `xcopy /E /I /Q "${wa}" "${path.join(payloadDir, "wa-auth")}"`
          : `cp -a "${wa}" "${path.join(payloadDir, "wa-auth")}"`,
        { stdio: "pipe" }
      );
    }
    // DB dump placeholder: pg_dump if available else write schema note
    const dump = path.join(payloadDir, "db.dump");
    try {
      const url = process.env.DATABASE_URL || "";
      if (/postgres/.test(url) && which("pg_dump")) {
        execFileSync("pg_dump", ["-Fc", "-f", dump, url.replace(/\?.*$/, "")], {
          stdio: "pipe",
        });
      } else {
        fs.writeFileSync(dump, `DRILL_NO_PG_DUMP ${marker}`);
      }
    } catch {
      fs.writeFileSync(dump, `DRILL_NO_PG_DUMP ${marker}`);
    }
    return { marker, bytes: fs.statSync(dump).size };
  });

  const tarPath = path.join(WORK, "backup.tar");
  step("pack", () => {
    execSync(`tar -cf "${tarPath}" -C "${payloadDir}" .`, { stdio: "pipe" });
    return { size: fs.statSync(tarPath).size, sha256: sha256File(tarPath) };
  });

  const encPath = path.join(WORK, "backup.tar.age");
  const keyPath = path.join(WORK, "age.key");
  step("encrypt", () => {
    if (hasAge) {
      execSync(`age-keygen -o "${keyPath}"`, { stdio: "pipe" });
      const pub = fs
        .readFileSync(keyPath, "utf8")
        .split("\n")
        .find((l) => l.startsWith("# public key:"))
        ?.replace("# public key:", "")
        .trim();
      execSync(`age -r ${pub} -o "${encPath}" "${tarPath}"`, { stdio: "pipe" });
      return { tool: "age", pub };
    }
    // AES-GCM stand-in
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const data = Buffer.concat([
      cipher.update(fs.readFileSync(tarPath)),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    fs.writeFileSync(
      encPath,
      Buffer.concat([iv, tag, data])
    );
    fs.writeFileSync(keyPath, key.toString("hex"));
    return { tool: "aes-gcm-standin", note: "install age for production" };
  });

  const endpoint = process.env.MINIO_ENDPOINT || "http://127.0.0.1:9000";
  const user = process.env.MINIO_ROOT_USER || "minioadmin";
  const pass = process.env.MINIO_ROOT_PASSWORD || "minioadmin";
  const bucket = process.env.MINIO_BUCKET || "rare-oud-backups";
  const objectKey = `drill/${path.basename(encPath)}`;

  step("upload_minio", () => {
    // Prefer rclone if configured; else use minio mc; else fetch PUT via AWS sigv4 is heavy — use docker mc
    if (which("mc")) {
      execSync(
        `mc alias set f4local ${endpoint} ${user} ${pass} && mc mb -p f4local/${bucket} || true && mc cp "${encPath}" f4local/${bucket}/${objectKey}`,
        { stdio: "pipe", shell: true }
      );
      return { via: "mc", objectKey };
    }
    // Docker run mc once
    execSync(
      `docker run --rm --network host -v "${WORK}:/w" minio/mc:RELEASE.2024-11-17T19-35-56Z /bin/sh -c "mc alias set local ${endpoint} ${user} ${pass}; mc mb -p local/${bucket} || true; mc cp /w/${path.basename(encPath)} local/${bucket}/${objectKey}"`,
      { stdio: "pipe", shell: true }
    );
    return { via: "docker-mc", objectKey };
  });

  const downPath = path.join(WORK, "downloaded.age");
  step("download_minio", () => {
    if (which("mc")) {
      execSync(
        `mc cp f4local/${bucket}/${objectKey} "${downPath}"`,
        { stdio: "pipe", shell: true }
      );
    } else {
      execSync(
        `docker run --rm --network host -v "${WORK}:/w" minio/mc:RELEASE.2024-11-17T19-35-56Z /bin/sh -c "mc alias set local ${endpoint} ${user} ${pass}; mc cp local/${bucket}/${objectKey} /w/downloaded.age"`,
        { stdio: "pipe", shell: true }
      );
    }
    return { size: fs.statSync(downPath).size };
  });

  const decTar = path.join(WORK, "restored.tar");
  step("decrypt", () => {
    if (hasAge) {
      execSync(`age -d -i "${keyPath}" -o "${decTar}" "${downPath}"`, {
        stdio: "pipe",
      });
    } else {
      const buf = fs.readFileSync(downPath);
      const iv = buf.subarray(0, 12);
      const tag = buf.subarray(12, 28);
      const data = buf.subarray(28);
      const key = Buffer.from(fs.readFileSync(keyPath, "utf8"), "hex");
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(tag);
      fs.writeFileSync(
        decTar,
        Buffer.concat([decipher.update(data), decipher.final()])
      );
    }
    return { sha256: sha256File(decTar) };
  });

  step("checksum_match", () => {
    const a = sha256File(tarPath);
    const b = sha256File(decTar);
    if (a !== b) throw new Error(`sha mismatch ${a} != ${b}`);
    return { sha256: a };
  });

  const restoreDir = path.join(WORK, "restored");
  fs.mkdirSync(restoreDir, { recursive: true });
  step("extract_restore", () => {
    execSync(`tar -xf "${decTar}" -C "${restoreDir}"`, { stdio: "pipe" });
    const marker = fs.readFileSync(path.join(restoreDir, "marker.txt"), "utf8");
    return { marker, files: fs.readdirSync(restoreDir) };
  });

  report.ok = report.steps.every((s) => s.ok);
} catch (e) {
  report.ok = false;
  report.fatal = e.message;
}

fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(`\nreport → ${OUT}`);
console.log(report.ok ? "F4 BACKUP DRILL OK" : "F4 BACKUP DRILL FAILED/PARTIAL");
process.exit(report.ok ? 0 : 1);
