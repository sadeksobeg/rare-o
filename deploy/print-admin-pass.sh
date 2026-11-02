#!/usr/bin/env bash
# For agent browser smoke only — do not log elsewhere.
set -euo pipefail
line=$(grep -E '^ADMIN_PASSWORD=' /srv/rareoud/.env.production | tail -n1)
val=${line#ADMIN_PASSWORD=}
val=${val%$'\r'}
if [[ "$val" == \"*\" ]]; then val=${val:1:-1}; fi
if [[ "$val" == \'*\' ]]; then val=${val:1:-1}; fi
printf '%s' "$val"
