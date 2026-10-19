#!/usr/bin/env bash
# Rare Oud production deploy (Ubuntu VPS) — run from repo root after git pull.
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE="docker compose -f docker-compose.prod.yml --env-file ${ENV_FILE}"

echo "[deploy] validate compose"
${COMPOSE} config >/dev/null

echo "[deploy] build & up"
${COMPOSE} up -d --build

echo "[deploy] migrate"
${COMPOSE} exec -T web npx prisma migrate deploy

echo "[deploy] readiness"
BASE="${DEPLOY_URL:-https://localhost}"
curl -fsS "${BASE}/api/ready" | head -c 400
echo ""

echo "[deploy] smoke (optional)"
if command -v npm >/dev/null 2>&1; then
  npm run smoke:prod -- "${BASE}" || true
fi

echo "[deploy] done"
