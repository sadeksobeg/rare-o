#!/usr/bin/env bash
set -euo pipefail
cd /srv/rareoud
echo '=== ENV KEYS (masked) ==='
grep -E '^(ADMIN_|TRADER_)' .env.production 2>/dev/null | sed 's/=.*/=***/' || echo '(none)'
echo '=== ADMIN EMAILS ==='
grep -E '^ADMIN_EMAIL=' .env.production | cut -d= -f2-
echo '=== TRADER EMAILS ==='
grep -E '^TRADER_EMAIL=' .env.production | cut -d= -f2- || echo '(not set)'
echo '=== ADMIN USERS ==='
docker compose -p rare-oud-prod --env-file .env.production -f docker-compose.prod.yml exec -T postgres \
  psql -U rareoud -d rareoud -c 'SELECT email, name FROM "AdminUser";'
echo '=== TRADER USERS ==='
docker compose -p rare-oud-prod --env-file .env.production -f docker-compose.prod.yml exec -T postgres \
  psql -U rareoud -d rareoud -c 'SELECT email, name FROM "TraderAccount";'
