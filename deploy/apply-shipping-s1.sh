#!/usr/bin/env bash
# Shipping Phase 1 — web-only. Applies additive migrate + idempotent import.
# Does NOT rebuild/restart worker. Does NOT touch WhatsApp .env flags.
set -euo pipefail
cd /srv/rareoud
SHA="${1:-unknown}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP="/var/lib/rareoud/backups/rareoud-pre-ship-s1-${STAMP}.dump"
ROLLBACK_TAG="rare-oud-web:pre-ship-s1-${STAMP}"

echo "=== DISK ==="; df -h / | sed -n '1,2p'
set +e
grep -nE 'WA_V_GATE_MOCK_CONNECTED|GATE_MOCK|WA_V_SEED' .env.production docker-compose.prod.yml 2>/dev/null
ENV_HIT=$?
set -e
[[ "$ENV_HIT" != "0" ]] || { echo REFUSING: mock flag; exit 2; }
echo env_guard=ok

# Keep WhatsApp offline-on-start as-is (force false if missing)
grep -q '^WHATSAPP_CONNECT_ON_START=' .env.production \
  && sed -i 's/^WHATSAPP_CONNECT_ON_START=.*/WHATSAPP_CONNECT_ON_START=false/' .env.production \
  || echo 'WHATSAPP_CONNECT_ON_START=false' >> .env.production

mkdir -p /var/lib/rareoud/backups
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  sh -c 'pg_dump -U rareoud -d rareoud -Fc -f /tmp/rareoud-pre-ship-s1.dump && ls -lh /tmp/rareoud-pre-ship-s1.dump'
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production cp \
  postgres:/tmp/rareoud-pre-ship-s1.dump "$DUMP"
SIZE=$(stat -c%s "$DUMP")
[[ "$SIZE" -ge 20000 ]] || { echo REFUSING dump tiny; exit 3; }
echo dump=$DUMP

docker tag rare-oud-web:prod "$ROLLBACK_TAG" || true
echo rollback=$ROLLBACK_TAG
echo "$SHA" > DEPLOY_SHA.txt

# Pull code (caller should have pushed the branch tip)
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git fetch --all --prune
  git checkout --force "$SHA" || git checkout --force "shipping/s1"
  git reset --hard "$SHA" || true
fi

ok=0
for attempt in 1 2 3 4 5; do
  echo "[build] attempt $attempt"
  if docker build --network=host -t rare-oud-web:prod \
    --build-arg NEXT_PUBLIC_SITE_URL=https://rareoud.com \
    --build-arg SITE_URL=https://rareoud.com \
    --build-arg SECURITY_EMAIL=security@rareoud.com \
    -f Dockerfile .; then ok=1; break; fi
  sleep 20
done
if [[ "$ok" != "1" ]]; then
  docker tag "$ROLLBACK_TAG" rare-oud-web:prod || true
  docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web
  echo BUILD_FAILED; exit 1
fi

# Web only — worker untouched
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web
sleep 22

curl -fsS http://127.0.0.1:3010/api/ready; echo
curl -sS -o /dev/null -w "health=%{http_code}\n" https://rareoud.com/api/health
curl -sS -o /dev/null -w "admin_login=%{http_code}\n" https://rareoud.com/admin/login
curl -sS -o /dev/null -w "admin_shipping=%{http_code}\n" https://rareoud.com/admin/shipping

# Migrate + import inside the new web container (additive only).
# docs/ is dockerignored — copy the seed into the image FS before import.
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T web \
  npx prisma migrate deploy
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -u root -T web \
  mkdir -p /app/docs/shipping
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production cp \
  docs/shipping/shipping-rates-seed.json web:/app/docs/shipping/shipping-rates-seed.json
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T web \
  npm run shipping:import

docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T web \
  printenv WHATSAPP_CONNECT_ON_START
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T worker \
  printenv WHATSAPP_CONNECT_ON_START || echo "worker_env_check_skipped"

echo "DONE_SHIPPING_S1_OK"
echo "dump=$DUMP"
echo "rollback=$ROLLBACK_TAG"
echo "sha=$SHA"
