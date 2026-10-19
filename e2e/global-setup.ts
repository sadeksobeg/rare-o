import { execSync } from "node:child_process";
import { loadProjectEnv } from "./helpers";
import { disconnectEnsureSeed, ensureE2EFixtures } from "./ensure-seed";

export default async function globalSetup(): Promise<void> {
  loadProjectEnv();

  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    console.warn(
      "[e2e global-setup] DATABASE_URL unset — skipping migrate/seed (tests may fail)"
    );
    return;
  }

  if (process.env.E2E_AUTO_SEED !== "0") {
    console.log("[e2e global-setup] migrate deploy + seed…");
    execSync("node node_modules/prisma/build/index.js migrate deploy", {
      stdio: "inherit",
      env: process.env,
    });
    execSync("node node_modules/tsx/dist/cli.mjs prisma/seed.ts", {
      stdio: "inherit",
      env: process.env,
    });
    execSync("node node_modules/tsx/dist/cli.mjs prisma/seed-demo.ts", {
      stdio: "inherit",
      env: process.env,
    });
  }

  await ensureE2EFixtures();
  await disconnectEnsureSeed();
}
