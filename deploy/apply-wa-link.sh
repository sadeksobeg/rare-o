#!/usr/bin/env bash
# Shipping WhatsApp quote/inbox realtime — web + worker. No migrations, no import, no worker/.env/nginx.
set -euo pipefail
cd /srv/rareoud
SHA="${1:?SHA required}"
STAMP="$(date +%Y%m%d-%H%M%S)"
BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
DUMP="/var/lib/rareoud/backups/rareoud-pre-wa-link-${STAMP}.dump"
ROLLBACK_TAG="rare-oud-web:pre-wa-link-${STAMP}"

echo "=== WORKER BEFORE ==="
docker inspect rare-oud-prod-worker-1 --format 'id={{.Id}} started={{.State.StartedAt}} status={{.State.Status}}'
WORKER_ID_BEFORE="$(docker inspect -f '{{.Id}}' rare-oud-prod-worker-1)"
WORKER_STARTED_BEFORE="$(docker inspect -f '{{.State.StartedAt}}' rare-oud-prod-worker-1)"

echo "=== DISK ==="; df -h / | sed -n '1,2p'
set +e
grep -nE 'WA_V_GATE_MOCK_CONNECTED|GATE_MOCK|WA_V_SEED' .env.production docker-compose.prod.yml 2>/dev/null
ENV_HIT=$?
set -e
[[ "$ENV_HIT" != "0" ]] || { echo REFUSING: mock flag; exit 2; }
echo env_guard=ok

mkdir -p /var/lib/rareoud/backups
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  sh -c 'pg_dump -U rareoud -d rareoud -Fc -f /tmp/rareoud-pre-wa-link.dump && ls -lh /tmp/rareoud-pre-wa-link.dump'
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production cp \
  postgres:/tmp/rareoud-pre-wa-link.dump "$DUMP"
SIZE=$(stat -c%s "$DUMP")
[[ "$SIZE" -ge 20000 ]] || { echo REFUSING dump tiny; exit 3; }
echo dump=$DUMP

docker tag rare-oud-web:prod "$ROLLBACK_TAG" || true
echo rollback=$ROLLBACK_TAG
echo "$SHA" > DEPLOY_SHA.txt

ok=0
for attempt in 1 2 3 4 5; do
  echo "[build] attempt $attempt sha=$SHA builtAt=$BUILD_TIME"
  if docker build --network=host -t rare-oud-web:prod \
    --build-arg NEXT_PUBLIC_SITE_URL=https://rareoud.com \
    --build-arg SITE_URL=https://rareoud.com \
    --build-arg SECURITY_EMAIL=security@rareoud.com \
    --build-arg GIT_SHA="$SHA" \
    --build-arg BUILD_TIME="$BUILD_TIME" \
    -f Dockerfile .; then ok=1; break; fi
  sleep 20
done
if [[ "$ok" != "1" ]]; then
  docker tag "$ROLLBACK_TAG" rare-oud-web:prod || true
  docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web worker
  echo BUILD_FAILED; exit 1
fi

# Web only — worker / .env / nginx untouched
# Additive migration BEFORE the new containers start (new code reads connectedPhone).
echo "=== MIGRATE (additive) ==="
if ! docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production run --rm --no-deps -T web npx prisma migrate deploy; then
  echo "MIGRATE_FAILED — restoring previous image, not starting new code"
  docker tag "$ROLLBACK_TAG" rare-oud-web:prod || true
  exit 5
fi
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web worker
sleep 25

echo "=== WORKER AFTER ==="
docker inspect rare-oud-prod-worker-1 --format 'id={{.Id}} started={{.State.StartedAt}} status={{.State.Status}}'
echo worker_restarted=expected

curl -fsS http://127.0.0.1:3010/api/ready; echo
curl -sS https://rareoud.com/api/health; echo
curl -sS -o /dev/null -w "health=%{http_code}\n" https://rareoud.com/api/health
curl -sS -o /dev/null -w "admin_login=%{http_code}\n" https://rareoud.com/admin/login

docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T web \
  printenv WHATSAPP_CONNECT_ON_START RO_GIT_SHA RO_BUILD_TIME || true
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T worker \
  printenv WHATSAPP_CONNECT_ON_START || echo "worker_env_check_skipped"

echo "DONE_WA_LINK_OK"
echo "dump=$DUMP"
echo "rollback=$ROLLBACK_TAG"
echo "sha=$SHA"
echo "builtAt=$BUILD_TIME"
echo "workerId=$WORKER_ID_AFTER"
echo "workerStarted=$WORKER_STARTED_AFTER"
