#!/usr/bin/env bash
set -euo pipefail
docker exec rare-oud-prod-web-1 grep -ohE 'ro-portal-main-col|ro-portal-shell|ro-cmd-search-trigger|ro-portal-header-start|width:0!important|ro-admin-kpi-strip' \
  /app/.next/static/css/1f7f9abdd417abff.css \
  /app/.next/static/css/e8fb6e201b5defda.css \
  | sort | uniq -c
echo '--- shell.tsx marker ---'
# Confirm server chunk mentions class (compiled)
docker exec rare-oud-prod-web-1 sh -c "grep -R 'ro-portal-main-col' /app/.next/server -l 2>/dev/null | head -5 || true"
