#!/usr/bin/env bash
# Prints ADMIN_EMAIL only (no password) for login tests.
set -euo pipefail
grep -E '^ADMIN_EMAIL=' /srv/rareoud/.env.production | tail -n1 | cut -d= -f2-
