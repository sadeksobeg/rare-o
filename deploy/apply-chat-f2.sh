#!/usr/bin/env bash
# CHAT-F2 deploy — no migrations. Same image for web + worker.
# Run on VPS from /srv/rareoud after code extract. Usage: bash deploy/apply-chat-f2.sh <sha>
set -euo pipefail
cd /srv/rareoud

SHA="${1:-unknown}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP="/var/lib/rareoud/backups/rareoud-pre-chat-f2-${STAMP}.dump"
ROLLBACK_TAG="rare-oud-web:pre-chat-f2-${STAMP}"

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
echo "env_guard=ok"

echo "=== FLAGS ==="
grep -E '^(WHATSAPP_CONNECT_ON_START|WHATSAPP_OUTBOUND_ENABLED)=' .env.production || true

echo "=== PG_DUMP ==="
mkdir -p /var/lib/rareoud/backups
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  sh -c 'pg_dump -U rareoud -d rareoud -Fc -f /tmp/rareoud-pre-chat-f2.dump && ls -lh /tmp/rareoud-pre-chat-f2.dump'
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production cp \
  postgres:/tmp/rareoud-pre-chat-f2.dump "$DUMP"
ls -lh "$DUMP"
file "$DUMP"
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  pg_restore -l /tmp/rareoud-pre-chat-f2.dump > /tmp/chat-f2-pg-restore.list
TOC_COUNT=$(grep -c '^[0-9]' /tmp/chat-f2-pg-restore.list || true)
SIZE=$(stat -c%s "$DUMP")
echo "dump_bytes=$SIZE toc_entries~$TOC_COUNT"
if [[ "$SIZE" -lt 20000 ]]; then
  echo "REFUSING: dump empty/tiny ($SIZE)" >&2
  exit 3
fi
if [[ "${TOC_COUNT:-0}" -lt 40 ]]; then
  echo "REFUSING: dump TOC too thin ($TOC_COUNT)" >&2
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

echo "=== BUILD once (same image for web+worker) ==="
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
  docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web worker
  exit 1
fi

echo "=== UP web + worker (same image) ==="
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web worker
sleep 22
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production ps

echo "=== NO MIGRATE ==="
echo skip_prisma_migrate=1

echo "=== SMOKE ==="
curl -fsS http://127.0.0.1:3010/api/ready; echo
curl -sS -o /dev/null -w "health=%{http_code}\n" https://rareoud.com/api/health
curl -sS -o /dev/null -w "admin_login=%{http_code}\n" https://rareoud.com/admin/login
curl -sS -o /dev/null -w "trader_messages=%{http_code}\n" https://rareoud.com/trader/messages

echo "=== FLAGS IN CONTAINERS ==="
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T web \
  printenv WHATSAPP_CONNECT_ON_START WHATSAPP_OUTBOUND_ENABLED || true
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T worker \
  printenv WHATSAPP_CONNECT_ON_START WHATSAPP_OUTBOUND_ENABLED || true

echo "=== PERMISSIONS-POLICY ==="
curl -sI "https://rareoud.com/admin/inbox" | tr -d '\r' | tee /tmp/chat-f2-pp.hdr | grep -iE '^(HTTP/|permissions-policy:)'
PP_COUNT=$(grep -ic '^permissions-policy:' /tmp/chat-f2-pp.hdr || true)
echo "count_permissions_policy=$PP_COUNT"
test "$PP_COUNT" = "1"
grep -qi 'microphone=(self)' /tmp/chat-f2-pp.hdr
! grep -qi 'microphone=()' /tmp/chat-f2-pp.hdr

echo "=== QUICK REPLIES ==="
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T web \
  node --input-type=module -e '
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const n = await p.whatsAppQuickReplyTemplate.count();
console.log("quick_replies="+n);
await p.$disconnect();
' || true

echo "=== DRY-RUN UNIFY COUNTS ==="
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T web \
  node --input-type=module -e '
import { PrismaClient } from "@prisma/client";
function score(wa){ if(/@s\.whatsapp\.net$/i.test(wa)) return 300; if(/@lid$/i.test(wa)) return 200; if(/@platform\.local$/i.test(wa)) return 50; return 100; }
const p = new PrismaClient();
const grouped = await p.whatsAppConversation.groupBy({ by:["traderId"], where:{ traderId:{ not:null } }, _count:{ _all:true } });
const multi = grouped.filter(g => g.traderId && g._count._all > 1);
console.log(JSON.stringify({ tradersChecked: grouped.filter(g=>g.traderId).length, mergesNeeded: multi.length }));
await p.$disconnect();
'

echo "DONE_CHAT_F2_OK"
echo "dump=$DUMP"
echo "rollback=$ROLLBACK_TAG"
echo "sha=$SHA"
