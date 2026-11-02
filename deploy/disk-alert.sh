#!/usr/bin/env bash
# Rare Oud disk gate: warn at 75%/90% of /var/lib/rareoud; hard note if root free < 40GB.
set -euo pipefail

ROOT_FREE_KB=$(df -Pk / | awk 'NR==2{print $4}')
ROOT_FREE_GB=$(awk -v k="$ROOT_FREE_KB" 'BEGIN{printf "%.1f", k/1024/1024}')
MEDIA_USE=$(df -P /var/lib/rareoud | awk 'NR==2{print $5}' | tr -d '%')
LOG=/var/log/rareoud-disk-alert.log
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

msg=""
if awk -v g="$ROOT_FREE_GB" 'BEGIN{exit !(g < 40)}'; then
  msg="${msg} ROOT_FREE=${ROOT_FREE_GB}GB<40GB"
fi
if [ "$MEDIA_USE" -ge 90 ]; then
  msg="${msg} MEDIA_USE=${MEDIA_USE}%>=90%"
elif [ "$MEDIA_USE" -ge 75 ]; then
  msg="${msg} MEDIA_USE=${MEDIA_USE}%>=75%"
fi

if [ -n "$msg" ]; then
  echo "${TS} ALERT${msg}" | tee -a "$LOG"
  logger -t rareoud-disk "ALERT${msg}"
else
  echo "${TS} OK root_free=${ROOT_FREE_GB}GB media_use=${MEDIA_USE}%" >>"$LOG"
fi
