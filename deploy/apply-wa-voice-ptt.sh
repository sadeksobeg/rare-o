#!/usr/bin/env bash
# Voice PTT fix — rebuild web+worker from the same image (session volume untouched).
# Keeps WHATSAPP_CONNECT_ON_START=false. No migrations.
set -euo pipefail
cd /srv/rareoud
SHA="${1:-unknown}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP="/var/lib/rareoud/backups/rareoud-pre-wa-voice-${STAMP}.dump"
ROLLBACK_TAG="rare-oud-web:pre-wa-voice-${STAMP}"

echo "=== DISK ==="; df -h / | sed -n '1,2p'
grep -q '^WHATSAPP_CONNECT_ON_START=' .env.production \
  && sed -i 's/^WHATSAPP_CONNECT_ON_START=.*/WHATSAPP_CONNECT_ON_START=false/' .env.production \
  || echo 'WHATSAPP_CONNECT_ON_START=false' >> .env.production

mkdir -p /var/lib/rareoud/backups
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  sh -c 'pg_dump -U rareoud -d rareoud -Fc -f /tmp/rareoud-pre-wa-voice.dump && ls -lh /tmp/rareoud-pre-wa-voice.dump'
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production cp \
  postgres:/tmp/rareoud-pre-wa-voice.dump "$DUMP"
SIZE=$(stat -c%s "$DUMP")
[[ "$SIZE" -ge 20000 ]] || { echo REFUSING dump tiny; exit 3; }
echo dump=$DUMP

docker tag rare-oud-web:prod "$ROLLBACK_TAG" || true
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
  docker tag "$ROLLBACK_TAG" rare-oud-web:prod || true
  docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web worker
  echo BUILD_FAILED; exit 1
fi

# Same image for web + worker (voice convert + Baileys PTT mime both needed)
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production up -d web worker
sleep 22

curl -fsS http://127.0.0.1:3010/api/ready; echo
curl -sS -o /dev/null -w "health=%{http_code}\n" https://rareoud.com/api/health
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T web printenv WHATSAPP_CONNECT_ON_START
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T worker printenv WHATSAPP_CONNECT_ON_START
docker compose -p rare-oud-prod -f docker-compose.prod.yml --env-file .env.production exec -T worker which ffmpeg

echo "DONE_WA_VOICE_PTT_OK"
echo "dump=$DUMP"
echo "rollback=$ROLLBACK_TAG"
echo "sha=$SHA"
