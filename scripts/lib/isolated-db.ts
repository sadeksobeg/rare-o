/**
 * Isolated test database for check scripts.
 *  - DATABASE_URL = postgres://…  → CREATE DATABASE <tmp>, `prisma migrate deploy`, DROP on cleanup
 *  - otherwise (SQLite fallback)   → temp file DB + `prisma migrate deploy`, removed on cleanup
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

export interface IsolatedDb {
  url: string;
  cleanup: () => Promise<void>;
}

function migrate(url: string) {
  execSync(`node node_modules/prisma/build/index.js migrate deploy`, {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
}

export async function createIsolatedDb(tag: string): Promise<IsolatedDb> {
  const base = process.env.DATABASE_URL ?? "";
  if (/^postgres(ql)?:\/\//.test(base)) {
    const name = `ro_${tag.replace(/\W/g, "_")}_${Date.now()}_${Math.floor(Math.random() * 1e4)}`.toLowerCase();
    const admin = new PrismaClient({ datasources: { db: { url: base } } });
    await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
    const u = new URL(base);
    u.pathname = "/" + name;
    const url = u.toString();
    try {
      migrate(url);
    } catch (e) {
      await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
      await admin.$disconnect();
      throw e;
    }
    return {
      url,
      cleanup: async () => {
        try {
          await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
        } finally {
          await admin.$disconnect();
        }
      },
    };
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `rare-oud-${tag}-`));
  const url = `file:${path.join(dir, "test.db").replace(/\\/g, "/")}`;
  migrate(url);
  return {
    url,
    cleanup: async () => {
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}
