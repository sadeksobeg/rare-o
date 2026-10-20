#!/usr/bin/env bash
# Smoke-test Caddy with `tls internal` proxying to Next.js on host :3000.
# Requires: Docker, curl, app listening on http://127.0.0.1:3000/api/health
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.ci-caddy.yml)

cleanup() {
  "${COMPOSE[@]}" down --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

if ! curl -fsS "http://127.0.0.1:3000/api/health" >/dev/null; then
  echo "ci-caddy-smoke: app not reachable at http://127.0.0.1:3000/api/health"
  exit 1
fi

"${COMPOSE[@]}" up -d --wait

for i in $(seq 1 30); do
  if curl -fsSk "https://127.0.0.1:8443/api/health" >/dev/null; then
    echo "ci-caddy-smoke: PASS (HTTPS via Caddy tls internal)"
    exit 0
  fi
  sleep 2
done

echo "ci-caddy-smoke: FAIL — Caddy did not serve /api/health on :8443"
"${COMPOSE[@]}" logs caddy || true
exit 1
