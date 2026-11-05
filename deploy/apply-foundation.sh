#!/usr/bin/env bash
set -euo pipefail
cp -a /srv/rareoud/.env.production /tmp/rareoud.env.production.bak
tar -xzf /tmp/rareoud-foundation.tgz -C /srv/rareoud
cp -a /tmp/rareoud.env.production.bak /srv/rareoud/.env.production
chmod 600 /srv/rareoud/.env.production
test -f /srv/rareoud/components/portal/notification-bell.tsx && echo HAS_BELL
test -f /srv/rareoud/components/motion/presets.ts && echo HAS_PRESETS
test -f /srv/rareoud/lib/portal/toast.ts && echo HAS_TOAST
grep -E 'WHATSAPP_CONNECT_ON_START|WHATSAPP_OUTBOUND_ENABLED' /srv/rareoud/.env.production
cd /srv/rareoud
docker compose -p rare-oud-prod --env-file .env.production -f docker-compose.prod.yml up -d --build --remove-orphans
echo '==== SMOKE ===='
for path in / /api/health /api/ready /admin/login /trader/login; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 "https://rareoud.com${path}")
  echo "${path} -> ${code}"
done
docker compose -p rare-oud-prod --env-file .env.production -f docker-compose.prod.yml ps --format '{{.Name}} {{.Status}}'
