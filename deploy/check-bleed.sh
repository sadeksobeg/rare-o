#!/usr/bin/env bash
set -euo pipefail
echo "=== source page ==="
grep -n 'ro-admin-kpi-strip\|max-w-\[1440' /srv/rareoud/app/admin/\(protected\)/page.tsx || true
echo "=== shell main ==="
grep -n 'max-w\|main-content\|className=.*main' /srv/rareoud/components/admin/shell.tsx || true
echo "=== container css ==="
docker exec rare-oud-prod-web-1 grep -c ro-admin-kpi-strip /app/.next/static/css/0ca6c1f8aff7bbbe.css || true
echo "=== container page.js ==="
docker exec rare-oud-prod-web-1 grep -c ro-admin-kpi-strip '/app/.next/server/app/admin/(protected)/page.js' || true
docker exec rare-oud-prod-web-1 grep -c '1440' '/app/.next/server/app/admin/(protected)/page.js' || true
echo "=== nginx cache ==="
grep -nE 'cache|expires|proxy_cache' /etc/nginx/sites-available/rareoud.com | head -20 || true
