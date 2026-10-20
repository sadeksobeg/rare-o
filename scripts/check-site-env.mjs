/**
 * Fail production builds when SITE_URL / SECURITY_EMAIL missing or *.local
 * CI should set: SITE_URL=https://ci.example.com SECURITY_EMAIL=security@ci.example.com
 * Skip when SKIP_SITE_ENV_CHECK=1 (local next build without prod gate).
 */
if (process.env.SKIP_SITE_ENV_CHECK === "1") {
  console.log("check-site-env: skipped (SKIP_SITE_ENV_CHECK=1)");
  process.exit(0);
}

const requireProd =
  process.env.NODE_ENV === "production" || process.env.REQUIRE_SITE_ENV === "1";

if (!requireProd) {
  console.log("check-site-env: skipped (not production / REQUIRE_SITE_ENV unset)");
  process.exit(0);
}

const site = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").trim();
const email = (process.env.SECURITY_EMAIL || "").trim();

function bad(label, value) {
  if (!value) return `${label} missing`;
  if (/\.local(\/|$)/i.test(value) || /@.*\.local$/i.test(value)) {
    return `${label} must not use .local (${value})`;
  }
  return null;
}

const errors = [bad("SITE_URL", site), bad("SECURITY_EMAIL", email)].filter(
  Boolean
);
if (errors.length) {
  console.error("check-site-env FAIL:\n" + errors.map((e) => ` - ${e}`).join("\n"));
  process.exit(1);
}
console.log("check-site-env OK", { site, email });
