/**
 * Parse Next.js `next build` stdout for First Load JS per app route.
 */
export const ROUTE_ALIASES = {
  home: ["/", "/(storefront)"],
  catalog: ["/catalog"],
  product: ["/product/[slug]", "/product/"],
  request: ["/request"],
  admin: ["/admin"],
  trader: ["/trader"],
};

export function parseFirstLoadJs(stdout) {
  const routes = {};
  const lineRe =
    /^[┌├└│]\s+[○ƒλ]\s+(\S+)\s+([\d.]+)\s+(B|kB|MB)\s+([\d.]+)\s+(B|kB|MB)/m;
  for (const raw of stdout.split(/\r?\n/)) {
    const line = raw.replace(/\x1b\[[0-9;]*m/g, "").trim();
    const m = line.match(
      /[○ƒλ]\s+(\/\S*)\s+([\d.]+)\s+(B|kB|MB)\s+([\d.]+)\s+(B|kB|MB)/
    );
    if (!m) continue;
    const pathName = m[1];
    const firstKb = toKb(Number(m[4]), m[5]);
    const pageKb = toKb(Number(m[2]), m[3]);
    routes[pathName] = { path: pathName, pageKb, firstLoadKb: firstKb };
  }
  return routes;
}

function toKb(n, unit) {
  if (unit === "B") return n / 1024;
  if (unit === "MB") return n * 1024;
  return n;
}

export function pickRoutes(all) {
  const picked = {};
  for (const [name, aliases] of Object.entries(ROUTE_ALIASES)) {
    let hit = null;
    for (const a of aliases) {
      if (all[a]) {
        hit = all[a];
        break;
      }
      const key = Object.keys(all).find(
        (k) => k === a || k.startsWith(a) || k.includes(a)
      );
      if (key) {
        hit = all[key];
        break;
      }
    }
    picked[name] = hit;
  }
  return picked;
}
