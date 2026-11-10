#!/usr/bin/env bash
set -euo pipefail
cd /srv/rareoud

echo "=== KILL SWITCHES (must stay false) ==="
grep -E '^(WHATSAPP_CONNECT_ON_START|WHATSAPP_OUTBOUND_ENABLED)=' .env.production || true

echo "=== BUILD (host network, retries) ==="
ok=0
for attempt in 1 2 3; do
  echo "[build] attempt ${attempt}"
  if docker build --network=host -t rare-oud-web:prod \
    --build-arg NEXT_PUBLIC_SITE_URL=https://rareoud.com \
    --build-arg SITE_URL=https://rareoud.com \
    --build-arg SECURITY_EMAIL=security@rareoud.com \
    -f Dockerfile .; then
    ok=1
    break
  fi
  sleep 8
done
[[ "$ok" == "1" ]] || { echo "build failed" >&2; exit 1; }

echo "=== UP web + worker ==="
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web worker
sleep 8
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production ps

echo "=== MIGRATE (additive WhatsAppOutboundSafetyState) ==="
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T web \
  npx prisma migrate deploy

echo "=== SMOKE ==="
curl -fsS http://127.0.0.1:3010/api/ready; echo
curl -sS -o /dev/null -w "health=%{http_code}\n" https://rareoud.com/api/health
curl -sS -o /dev/null -w "admin_login=%{http_code}\n" https://rareoud.com/admin/login

echo "=== KILL SWITCHES AFTER ==="
grep -E '^(WHATSAPP_CONNECT_ON_START|WHATSAPP_OUTBOUND_ENABLED)=' .env.production || true
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T worker \
  printenv WHATSAPP_CONNECT_ON_START WHATSAPP_OUTBOUND_ENABLED 2>/dev/null || true

echo "=== DONE 046c6eb ==="
