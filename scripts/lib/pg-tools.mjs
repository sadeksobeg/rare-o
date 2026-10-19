/**
 * D2 helpers: run pg_dump / pg_restore / psql either with local binaries (if on PATH)
 * or through `docker exec` into the compose container (default: rare-oud-postgres).
 * Nothing here ever prints the password.
 */
import { spawnSync, spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";

export function isPostgresUrl(url) {
  return /^postgres(ql)?:\/\//.test(url || "");
}

export function parseDatabaseUrl(url) {
  const u = new URL(url);
  return {
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    host: u.hostname,
    port: u.port || "5432",
    database: u.pathname.replace(/^\//, ""),
  };
}

export function withDatabase(url, db) {
  const u = new URL(url);
  u.pathname = "/" + db;
  return u.toString();
}

const CONTAINER = process.env.POSTGRES_CONTAINER || "rare-oud-postgres";

function hasLocal(bin) {
  const r = spawnSync(bin, ["--version"], { encoding: "utf8" });
  return r.status === 0;
}

/** "local" when pg_dump on PATH (and PG_TOOLS != docker), otherwise "docker". */
export function pgMode() {
  if (process.env.PG_TOOLS === "docker") return "docker";
  if (process.env.PG_TOOLS === "local") return "local";
  return hasLocal("pg_dump") && hasLocal("pg_restore") && hasLocal("psql") ? "local" : "docker";
}

/** Build [command, args, env] for a pg client binary against `url`. */
function build(bin, url, extraArgs, { interactiveStdin = false } = {}) {
  const c = parseDatabaseUrl(url);
  if (pgMode() === "local") {
    return {
      cmd: bin,
      args: ["-h", c.host, "-p", c.port, "-U", c.user, ...extraArgs],
      env: { ...process.env, PGPASSWORD: c.password },
    };
  }
  // Inside the container Postgres listens on localhost:5432 regardless of the published host port.
  return {
    cmd: "docker",
    args: [
      "exec",
      ...(interactiveStdin ? ["-i"] : []),
      "-e",
      `PGPASSWORD=${c.password}`,
      CONTAINER,
      bin,
      "-h",
      "localhost",
      "-U",
      c.user,
      ...extraArgs,
    ],
    env: process.env,
  };
}

/** pg_dump (custom format) → file. */
export function pgDump(url, outFile) {
  const c = parseDatabaseUrl(url);
  const { cmd, args, env } = build("pg_dump", url, ["-Fc", "--no-owner", "-d", c.database]);
  return new Promise((resolve, reject) => {
    const out = createWriteStream(outFile);
    const p = spawn(cmd, args, { env, stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.stdout.pipe(out);
    p.on("error", reject);
    p.on("close", (code) => {
      out.end();
      if (code === 0) resolve();
      else reject(new Error(`pg_dump exited ${code}: ${err.trim()}`));
    });
  });
}

/** pg_restore from a custom-format file into database `db` (must exist). */
export function pgRestore(url, db, file) {
  const { cmd, args, env } = build(
    "pg_restore",
    url,
    ["--no-owner", "--exit-on-error", "-d", db],
    { interactiveStdin: true }
  );
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { env, stdio: ["pipe", "pipe", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    createReadStream(file).pipe(p.stdin);
    p.on("error", reject);
    p.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`pg_restore exited ${code}: ${err.trim()}`))
    );
  });
}

/** Run SQL via psql against database `db`; returns trimmed stdout (tuples only, unaligned). */
export function psql(url, db, sql) {
  const { cmd, args, env } = build("psql", url, ["-d", db, "-v", "ON_ERROR_STOP=1", "-t", "-A", "-c", sql]);
  const r = spawnSync(cmd, args, { env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`psql failed: ${(r.stderr || r.error?.message || "").trim()}`);
  return r.stdout.trim();
}

export function tableCounts(url, db) {
  const tables = psql(
    url,
    db,
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
  )
    .split(/\r?\n/)
    .filter(Boolean);
  const counts = {};
  for (const t of tables) counts[t] = Number(psql(url, db, `SELECT count(*) FROM "${t}"`));
  return counts;
}
