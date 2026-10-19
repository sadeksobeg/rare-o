#!/usr/bin/env bash
# Ubuntu 22.04/24.04 first-time VPS bootstrap for Rare Oud (Docker + ufw).
# Run as root or with sudo once per server.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl git ufw

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

mkdir -p /var/lib/rare-oud/whatsapp-auth
chmod 700 /var/lib/rare-oud/whatsapp-auth

echo "[bootstrap] Docker $(docker --version)"
echo "[bootstrap] Set WHATSAPP_AUTH_DIR=/var/lib/rare-oud/whatsapp-auth in .env.production"
echo "[bootstrap] Clone repo, copy .env.production, then: ./scripts/deploy.sh"
