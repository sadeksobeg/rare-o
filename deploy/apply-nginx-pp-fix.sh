#!/usr/bin/env bash
set -euo pipefail

LIVE=/etc/nginx/sites-available/rareoud.com
STAMP=$(date +%Y%m%d-%H%M%S)
BAK=/root/nginx-rareoud.com.conf.bak.${STAMP}

# Ensure symlink hygiene
if [ ! -L /etc/nginx/sites-enabled/rareoud.com ]; then
  cp -a /etc/nginx/sites-enabled/rareoud.com "$LIVE" 2>/dev/null || true
  rm -f /etc/nginx/sites-enabled/rareoud.com
  ln -s "$LIVE" /etc/nginx/sites-enabled/rareoud.com
fi
rm -f /etc/nginx/sites-enabled/*.bak* /etc/nginx/sites-available/rareoud.com.bak-pp

cp -a "$LIVE" "$BAK"
echo "backup=$BAK"

# Strip security headers that Next.js also sets (single source of truth = next.config.ts)
# Keep Cache-Control on /_next/static only.
python3 - <<'PY'
from pathlib import Path
p = Path("/etc/nginx/sites-available/rareoud.com")
text = p.read_text()
drop_keys = (
    "Permissions-Policy",
    "Strict-Transport-Security",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
)
out = []
for line in text.splitlines(True):
    if "add_header" in line and any(k in line for k in drop_keys):
        continue
    out.append(line)
p.write_text("".join(out))
print("stripped Next-duplicated security add_header lines")
PY

echo "=== remaining add_header ==="
grep -n add_header "$LIVE" || true

nginx -t
systemctl reload nginx

echo "=== headers ==="
curl -sI "https://rareoud.com/admin/inbox" | tr -d '\r' | tee /tmp/pp.hdr | grep -iE '^(HTTP/|permissions-policy:|strict-transport-security:|x-frame-options:|x-content-type-options:|referrer-policy:)'

PP=$(grep -ic '^permissions-policy:' /tmp/pp.hdr || true)
HSTS=$(grep -ic '^strict-transport-security:' /tmp/pp.hdr || true)
XF=$(grep -ic '^x-frame-options:' /tmp/pp.hdr || true)
echo "count_permissions_policy=$PP"
echo "count_hsts=$HSTS"
echo "count_x_frame=$XF"

test "$PP" = "1"
grep -qi 'microphone=(self)' /tmp/pp.hdr
! grep -qi 'microphone=()' /tmp/pp.hdr

echo "=== NGINX SECURITY HEADER DEDUPE OK ==="
