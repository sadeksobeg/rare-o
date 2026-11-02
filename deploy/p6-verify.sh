#!/usr/bin/env bash
set -euo pipefail

echo '=== PUBLIC SMOKE ==='
for path in / /api/health /api/ready /catalog /admin/login /trader/login; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "https://rareoud.com${path}")
  echo "${path} -> ${code}"
done

echo '=== TENEGTA ==='
curl -sI --max-time 15 https://tenegta.com/ | head -8
curl -sI --max-time 15 https://mail.tenegta.com/ | head -8

echo '=== COMPOSE ==='
cd /srv/rareoud
docker compose -p rare-oud-prod -f docker-compose.prod.yml ps

echo '=== BACKUPS ==='
ls -lah /var/lib/rareoud/backups | head -20
df -h / /var/lib/rareoud /srv/rareoud
avail_kb=$(df -Pk / | awk 'NR==2{print $4}')
avail_gb=$(awk -v k="$avail_kb" 'BEGIN{printf "%.1f", k/1024/1024}')
echo "free_gb=${avail_gb}"

echo '=== MEDIA USAGE ==='
du -sh /var/lib/rareoud/* 2>/dev/null || true

echo '=== WA ==='
grep -E 'WHATSAPP_(CONNECT_ON_START|OUTBOUND_ENABLED)=' /srv/rareoud/.env.production

echo '=== UFW ==='
ufw status || true

echo '=== LISTENERS ==='
ss -tlnp | grep -E ':80|:443|:3010|:22' || true
