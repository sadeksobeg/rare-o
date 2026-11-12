#!/usr/bin/env bash
# WhatsApp closure final release — no migrations. Same image for web + worker.
# Usage on VPS from /srv/rareoud: bash deploy/apply-wa-closure.sh <sha>
set -euo pipefail
cd /srv/rareoud

SHA="${1:-unknown}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP="/var/lib/rareoud/backups/rareoud-pre-wa-closure-${STAMP}.dump"
ROLLBACK_TAG="rare-oud-web:pre-wa-closure-${STAMP}"

echo "=== DISK ==="
df -h / | sed -n '1,2p'

echo "=== ENV GUARD ==="
set +e
grep -nE 'WA_V_GATE_MOCK_CONNECTED|GATE_MOCK|WA_V_SEED|wa-v-seed-gate' .env.production docker-compose.prod.yml 2>/dev/null
ENV_HIT=$?
set -e
if [[ "$ENV_HIT" == "0" ]]; then
  echo "REFUSING: gate/mock/seed flag found" >&2
  exit 2
fi
echo "env_guard=ok"

echo "=== FLAGS ==="
grep -E '^(WHATSAPP_CONNECT_ON_START|WHATSAPP_OUTBOUND_ENABLED)=' .env.production || true
if grep -q '^WHATSAPP_CONNECT_ON_START=' .env.production; then
  sed -i 's/^WHATSAPP_CONNECT_ON_START=.*/WHATSAPP_CONNECT_ON_START=false/' .env.production
else
  echo 'WHATSAPP_CONNECT_ON_START=false' >> .env.production
fi

echo "=== PG_DUMP ==="
mkdir -p /var/lib/rareoud/backups
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  sh -c 'pg_dump -U rareoud -d rareoud -Fc -f /tmp/rareoud-pre-wa-closure.dump && ls -lh /tmp/rareoud-pre-wa-closure.dump'
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production cp \
  postgres:/tmp/rareoud-pre-wa-closure.dump "$DUMP"
SIZE=$(stat -c%s "$DUMP")
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  pg_restore -l /tmp/rareoud-pre-wa-closure.dump > /tmp/wa-closure-pg-restore.list
TOC_COUNT=$(grep -c '^[0-9]' /tmp/wa-closure-pg-restore.list || true)
echo "dump_bytes=$SIZE toc_entries~$TOC_COUNT"
if [[ "$SIZE" -lt 20000 || "${TOC_COUNT:-0}" -lt 40 ]]; then
  echo "REFUSING: dump too thin" >&2
  exit 3
fi
echo "dump=$DUMP"

echo "=== ROLLBACK IMAGE TAG ==="
docker tag rare-oud-web:prod "$ROLLBACK_TAG"
echo "rollback=$ROLLBACK_TAG"

echo "$SHA" > DEPLOY_SHA.txt
cat DEPLOY_SHA.txt

echo "=== BUILD once ==="
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
  sleep 20
done
if [[ "$ok" != "1" ]]; then
  echo "BUILD_FAILED — restoring rollback" >&2
  docker tag "$ROLLBACK_TAG" rare-oud-web:prod
  docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web worker
  exit 1
fi

echo "=== UP web + worker ==="
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web worker
sleep 22
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production ps

echo "=== NO MIGRATE ==="
echo skip_prisma_migrate=1

echo "=== SMOKE ==="
curl -fsS http://127.0.0.1:3010/api/ready; echo
curl -sS -o /dev/null -w "health=%{http_code}\n" https://rareoud.com/api/health
curl -sS -o /dev/null -w "trader_messages=%{http_code}\n" https://rareoud.com/trader/messages
curl -sI "https://rareoud.com/admin/inbox" | tr -d '\r' | tee /tmp/wa-closure-pp.hdr | grep -iE '^(HTTP/|permissions-policy:)'
test "$(grep -ic '^permissions-policy:' /tmp/wa-closure-pp.hdr)" = "1"
grep -qi 'microphone=(self)' /tmp/wa-closure-pp.hdr

docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T web \
  node --input-type=module -e 'import { PrismaClient } from "@prisma/client"; const p=new PrismaClient(); console.log("quick_replies="+(await p.whatsAppQuickReplyTemplate.count())); await p.$disconnect();'

docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T web \
  node --input-type=module -e 'import { PrismaClient } from "@prisma/client"; const p=new PrismaClient(); const g=await p.whatsAppConversation.groupBy({by:["traderId"],where:{traderId:{not:null}},_count:{_all:true}}); const multi=g.filter(x=>x.traderId&&x._count._all>1); console.log(JSON.stringify({tradersChecked:g.filter(x=>x.traderId).length,mergesNeeded:multi.length})); await p.$disconnect();'

docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T web \
  printenv WHATSAPP_CONNECT_ON_START WHATSAPP_OUTBOUND_ENABLED || true
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T worker \
  printenv WHATSAPP_CONNECT_ON_START WHATSAPP_OUTBOUND_ENABLED || true

echo "DONE_WA_CLOSURE_OK"
echo "dump=$DUMP"
echo "rollback=$ROLLBACK_TAG"
echo "sha=$SHA"
