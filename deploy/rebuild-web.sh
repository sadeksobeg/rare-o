#!/usr/bin/env bash
set -euo pipefail
cd /srv/rareoud
echo "[rebuild] building rare-oud-web:prod with host network"
ok=0
for attempt in 1 2 3; do
  echo "[rebuild] attempt ${attempt}"
  if docker build --network=host -t rare-oud-web:prod \
    --build-arg NEXT_PUBLIC_SITE_URL=https://rareoud.com \
    --build-arg SITE_URL=https://rareoud.com \
    --build-arg SECURITY_EMAIL=security@rareoud.com \
    -f Dockerfile .; then
    ok=1
    break
  fi
  echo "[rebuild] build failed (often next/font); sleeping then retry"
  sleep 8
done
if [[ "$ok" != "1" ]]; then
  echo "[rebuild] all attempts failed" >&2
  exit 1
fi
echo "[rebuild] restarting web"
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web
sleep 5
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production ps web
curl -fsS http://127.0.0.1:3010/api/ready
echo
curl -sS -o /dev/null -w "health=%{http_code}\n" https://rareoud.com/api/health
curl -sS -o /dev/null -w "admin_login=%{http_code}\n" https://rareoud.com/admin/login
echo "[rebuild] done"
