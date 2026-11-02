#!/usr/bin/env bash
# Create admin + trader only (no catalog seed). Idempotent upsert.
set -euo pipefail
cd /srv/rareoud

env_get() {
  local key="$1"
  # Prefer last matching KEY= value; strip surrounding quotes
  local line
  line=$(grep -E "^${key}=" .env.production | tail -n1 || true)
  [ -n "$line" ] || { echo ""; return 0; }
  local val="${line#*=}"
  val="${val%$'\r'}"
  if [[ "$val" == \"*\" ]]; then val="${val:1:-1}"; fi
  if [[ "$val" == \'*\' ]]; then val="${val:1:-1}"; fi
  printf '%s' "$val"
}

ADMIN_EMAIL="$(env_get ADMIN_EMAIL)"
ADMIN_PASSWORD="$(env_get ADMIN_PASSWORD)"
ADMIN_NAME="$(env_get ADMIN_NAME)"
TRADER_EMAIL="$(env_get TRADER_EMAIL)"
TRADER_PASSWORD="$(env_get TRADER_PASSWORD)"

if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  echo "ADMIN_EMAIL/ADMIN_PASSWORD missing in .env.production" >&2
  exit 1
fi
[ -n "$ADMIN_NAME" ] || ADMIN_NAME="RARE OUD Admin"

if [ -z "$TRADER_EMAIL" ]; then
  TRADER_EMAIL="trader@rareoud.com"
  TRADER_PASSWORD="$(openssl rand -base64 18 | tr -d '=+/' | cut -c1-24)"
  printf '\nTRADER_EMAIL=%s\nTRADER_PASSWORD=%s\n' "$TRADER_EMAIL" "$TRADER_PASSWORD" >> .env.production
  chmod 600 .env.production
  echo "Appended TRADER_* to .env.production"
fi

if [ -z "$TRADER_PASSWORD" ]; then
  echo "TRADER_PASSWORD missing" >&2
  exit 1
fi

export ADMIN_EMAIL ADMIN_PASSWORD ADMIN_NAME TRADER_EMAIL TRADER_PASSWORD

docker compose -p rare-oud-prod --env-file .env.production -f docker-compose.prod.yml exec -T \
  -e ADMIN_EMAIL -e ADMIN_PASSWORD -e ADMIN_NAME -e TRADER_EMAIL -e TRADER_PASSWORD \
  web node -e '
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
(async () => {
  const prisma = new PrismaClient();
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPass = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "RARE OUD Admin";
  const traderEmail = process.env.TRADER_EMAIL;
  const traderPass = process.env.TRADER_PASSWORD;
  const adminHash = await bcrypt.hash(adminPass, 12);
  const traderHash = await bcrypt.hash(traderPass, 12);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, name: adminName, mustChangePassword: true },
    create: { email: adminEmail, passwordHash: adminHash, name: adminName, mustChangePassword: true },
  });
  await prisma.traderAccount.upsert({
    where: { email: traderEmail },
    update: { passwordHash: traderHash, displayName: "RARE OUD Trader", status: "active", mustChangePassword: true },
    create: {
      email: traderEmail,
      passwordHash: traderHash,
      displayName: "RARE OUD Trader",
      companyName: "RARE OUD",
      status: "active",
      mustChangePassword: true,
      adminNotes: "Bootstrap account (no catalog seed)",
    },
  });
  console.log("BOOTSTRAP_OK");
  console.log("ADMIN_EMAIL=" + adminEmail);
  console.log("ADMIN_PASSWORD=" + adminPass);
  console.log("TRADER_EMAIL=" + traderEmail);
  console.log("TRADER_PASSWORD=" + traderPass);
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
'
