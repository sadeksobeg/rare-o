#!/usr/bin/env bash
# WA closure R2 — no migrations. Same image web+worker.
set -euo pipefail
cd /srv/rareoud
SHA="${1:-unknown}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP="/var/lib/rareoud/backups/rareoud-pre-wa-r2-${STAMP}.dump"
ROLLBACK_TAG="rare-oud-web:pre-wa-r2-${STAMP}"

echo "=== DISK ==="; df -h / | sed -n '1,2p'
set +e
grep -nE 'WA_V_GATE_MOCK_CONNECTED|GATE_MOCK|WA_V_SEED' .env.production docker-compose.prod.yml 2>/dev/null
ENV_HIT=$?
set -e
[[ "$ENV_HIT" != "0" ]] || { echo REFUSING: mock flag; exit 2; }
echo env_guard=ok

sed -i 's/^WHATSAPP_CONNECT_ON_START=.*/WHATSAPP_CONNECT_ON_START=false/' .env.production || echo 'WHATSAPP_CONNECT_ON_START=false' >> .env.production

mkdir -p /var/lib/rareoud/backups
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  sh -c 'pg_dump -U rareoud -d rareoud -Fc -f /tmp/rareoud-pre-wa-r2.dump && ls -lh /tmp/rareoud-pre-wa-r2.dump'
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production cp \
  postgres:/tmp/rareoud-pre-wa-r2.dump "$DUMP"
SIZE=$(stat -c%s "$DUMP")
[[ "$SIZE" -ge 20000 ]] || { echo REFUSING dump tiny; exit 3; }
echo dump=$DUMP

docker tag rare-oud-web:prod "$ROLLBACK_TAG"
echo rollback=$ROLLBACK_TAG
echo "$SHA" > DEPLOY_SHA.txt

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
  docker tag "$ROLLBACK_TAG" rare-oud-web:prod
  docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web worker
  echo BUILD_FAILED; exit 1
fi

docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web worker
sleep 22

curl -fsS http://127.0.0.1:3010/api/ready; echo
curl -sS -o /dev/null -w "health=%{http_code}\n" https://rareoud.com/api/health
curl -sS -o /dev/null -w "trader_messages=%{http_code}\n" https://rareoud.com/trader/messages
curl -sI "https://rareoud.com/admin/inbox" | tr -d '\r' | tee /tmp/wa-r2-pp.hdr | grep -iE '^(HTTP/|permissions-policy:)'
test "$(grep -ic '^permissions-policy:' /tmp/wa-r2-pp.hdr)" = "1"
grep -qi 'microphone=(self)' /tmp/wa-r2-pp.hdr

docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T web \
  node --input-type=module -e 'import { PrismaClient } from "@prisma/client"; const p=new PrismaClient(); console.log("quick_replies="+(await p.whatsAppQuickReplyTemplate.count())); await p.$disconnect();'
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T web \
  node --input-type=module -e 'import { PrismaClient } from "@prisma/client"; const p=new PrismaClient(); const g=await p.whatsAppConversation.groupBy({by:["traderId"],where:{traderId:{not:null}},_count:{_all:true}}); console.log(JSON.stringify({tradersChecked:g.filter(x=>x.traderId).length,mergesNeeded:g.filter(x=>x.traderId&&x._count._all>1).length})); await p.$disconnect();'
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T web printenv WHATSAPP_CONNECT_ON_START
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T worker printenv WHATSAPP_CONNECT_ON_START

echo "DONE_WA_R2_OK"
echo "dump=$DUMP"
echo "rollback=$ROLLBACK_TAG"
echo "sha=$SHA"
