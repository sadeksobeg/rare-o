#!/usr/bin/env bash
set -euo pipefail
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
echo '=== with UA ==='
curl -sS -A "$UA" --max-time 20 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&display=swap' | head -c 500
echo
echo "LEN=$(curl -sS -A "$UA" --max-time 20 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&display=swap' | wc -c)"
echo '=== docker web ==='
docker ps --filter name=rare-oud-prod-web --format '{{.Names}} {{.Status}}'
