#!/usr/bin/env bash
set -euo pipefail
CSS=$(docker exec rare-oud-prod-web-1 sh -c 'ls /app/.next/static/css/ | head -1')
echo "CSS=$CSS"
docker exec rare-oud-prod-web-1 sh -c "grep -c 1440 /app/.next/static/css/$CSS || true"
docker exec rare-oud-prod-web-1 sh -c "grep -c 'ro-admin-kpi-strip' /app/.next/static/css/$CSS || true"
echo "=== any 1440 in admin server page ==="
docker exec rare-oud-prod-web-1 sh -c "grep -c 1440 '/app/.next/server/app/admin/(protected)/page.js' || true"
echo "=== shell source on disk ==="
grep -n 'max-w\|px-\|main-content' /srv/rareoud/components/admin/shell.tsx
echo "=== page greeting class ==="
grep -n 'ro-admin-greeting\|rounded' /srv/rareoud/app/admin/\(protected\)/page.tsx | head
