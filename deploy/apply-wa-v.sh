#!/usr/bin/env bash
# WA-V safe deploy — UI-only, no migrations. Run on VPS after tarball extract OR from /srv/rareoud with fresh code.
set -euo pipefail
cd /srv/rareoud

SHA="${1:-unknown}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP="/var/lib/rareoud/backups/rareoud-pre-wa-v-${STAMP}.dump"
ROLLBACK_TAG="rare-oud-web:pre-wa-v-${STAMP}"

echo "=== DISK ==="
df -h / | sed -n '1,2p'

echo "=== ENV GUARD (mock/gate flags must be ABSENT) ==="
set +e
grep -nE 'WA_V_GATE_MOCK_CONNECTED|GATE_MOCK|WA_V_SEED|wa-v-seed-gate' .env.production docker-compose.prod.yml 2>/dev/null
ENV_HIT=$?
set -e
if [[ "$ENV_HIT" == "0" ]]; then
  echo "REFUSING: gate/mock/seed flag found in prod env/compose" >&2
  exit 2
fi
echo "env_guard=ok (no WA_V_GATE_MOCK_CONNECTED)"

echo "=== FLAGS (must remain unchanged) ==="
grep -E '^(WHATSAPP_CONNECT_ON_START|WHATSAPP_OUTBOUND_ENABLED)=' .env.production || true

echo "=== PG_DUMP ==="
mkdir -p /var/lib/rareoud/backups
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  sh -c 'pg_dump -U rareoud -d rareoud -Fc -f /tmp/rareoud-pre-wa-v.dump && ls -lh /tmp/rareoud-pre-wa-v.dump'
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production cp \
  postgres:/tmp/rareoud-pre-wa-v.dump "$DUMP"
ls -lh "$DUMP"
file "$DUMP"
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  pg_restore -l /tmp/rareoud-pre-wa-v.dump > /tmp/wa-v-pg-restore.list
HEAD_TOC=$(head -5 /tmp/wa-v-pg-restore.list | tr '\n' ' ')
TOC_COUNT=$(grep -c '^[0-9]' /tmp/wa-v-pg-restore.list || true)
SIZE=$(stat -c%s "$DUMP")
echo "dump_bytes=$SIZE toc_entries~$TOC_COUNT head=$HEAD_TOC"
if [[ "$SIZE" -lt 1000000 ]]; then
  echo "REFUSING: dump too small ($SIZE)" >&2
  exit 3
fi
echo "dump=$DUMP"

echo "=== ROLLBACK IMAGE TAG ==="
docker tag rare-oud-web:prod "$ROLLBACK_TAG"
echo "rollback=$ROLLBACK_TAG"
docker images rare-oud-web --format '{{.Tag}} {{.ID}} {{.CreatedSince}}' | head -8

echo "=== DEPLOY_SHA ==="
echo "$SHA" > DEPLOY_SHA.txt
cat DEPLOY_SHA.txt

echo "=== BUILD (web image; retries for next/font) ==="
ok=0
for attempt in 1 2 3 4 5; do
  echo "[build] attempt ${attempt}"
  if docker build --network=host -t rare-oud-web:prod \
    --build-arg NEXT_PUBLIC_SITE_URL=https://rareoud.com \
    --build-arg SITE_URL=https://rareoud.com \
    --build-arg SECURITY_EMAIL=security@rareoud.com \
    -f Dockerfile .; then
    ok=1
    break
  fi
  echo "[build] failed; sleeping 20s"
  sleep 20
done
if [[ "$ok" != "1" ]]; then
  echo "BUILD_FAILED — restoring rollback tag to prod" >&2
  docker tag "$ROLLBACK_TAG" rare-oud-web:prod
  docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web
  exit 1
fi

echo "=== UP web ONLY (worker left on previous container) ==="
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web
sleep 18
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production ps

echo "=== NO MIGRATE (UI-only) ==="
echo "skip_prisma_migrate=1"

echo "=== SMOKE ==="
curl -fsS http://127.0.0.1:3010/api/ready; echo
curl -sS -o /dev/null -w "health=%{http_code}\n" https://rareoud.com/api/health
curl -sS -o /dev/null -w "admin_login=%{http_code}\n" https://rareoud.com/admin/login

echo "=== RUNTIME FLAGS ==="
grep -E '^(WHATSAPP_CONNECT_ON_START|WHATSAPP_OUTBOUND_ENABLED)=' .env.production || true
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T web \
  printenv WHATSAPP_CONNECT_ON_START WHATSAPP_OUTBOUND_ENABLED || true
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T worker \
  printenv WHATSAPP_CONNECT_ON_START WHATSAPP_OUTBOUND_ENABLED || true

echo "=== PERMISSIONS-POLICY ==="
curl -sI "https://rareoud.com/admin/inbox" | tr -d '\r' | tee /tmp/wa-v-pp.hdr | grep -iE '^(HTTP/|permissions-policy:)'
PP_COUNT=$(grep -ic '^permissions-policy:' /tmp/wa-v-pp.hdr || true)
echo "count_permissions_policy=$PP_COUNT"
test "$PP_COUNT" = "1"
grep -qi 'microphone=(self)' /tmp/wa-v-pp.hdr
! grep -qi 'microphone=()' /tmp/wa-v-pp.hdr

echo "=== DONE WA-V ==="
echo "dump=$DUMP"
echo "rollback=$ROLLBACK_TAG"
echo "sha=$SHA"
