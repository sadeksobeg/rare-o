#!/usr/bin/env bash
set -euo pipefail
cd /srv/rareoud
docker compose -p rare-oud-prod --env-file .env.production -f docker-compose.prod.yml exec -T web npx prisma migrate deploy
echo '==== SMOKE ===='
for path in / /api/health /api/ready /catalog /admin/login /trader/login /trader/brokerage/new /trader/deals/new; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "https://rareoud.com${path}")
  echo "${path} -> ${code}"
done
echo '==== WA ===='
grep -E 'WHATSAPP_CONNECT_ON_START|WHATSAPP_OUTBOUND_ENABLED' .env.production
docker compose -p rare-oud-prod --env-file .env.production -f docker-compose.prod.yml ps --format '{{.Name}} {{.Status}}'
