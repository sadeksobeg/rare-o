#!/usr/bin/env bash
set -euo pipefail
cd /srv/rareoud
docker compose -p rare-oud-prod --env-file .env.production -f docker-compose.prod.yml exec -T postgres \
  psql -U rareoud -d rareoud -c "SELECT column_name FROM information_schema.columns WHERE table_name IN ('DealProposal','BrokerageRequest') AND column_name IN ('modelNumber','statedPriceUsd','whatsAppDeepLink','paymentConfirmedAt','handoffMessageText') ORDER BY table_name, column_name;"
