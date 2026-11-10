#!/bin/sh
# Runs inside postgres:16-alpine (has pg_dump). Copies uploads + wa-auth if mounted.
set -eu
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
OUT_ROOT="${BACKUP_ROOT:-/backups}"

while true; do
  STAMP="$(date -u +%Y-%m-%dT%H-%M-%S)"
  DEST="${OUT_ROOT}/daily-${STAMP}"
  mkdir -p "${DEST}"
  echo "[backup] dumping to ${DEST}/db.dump"
  pg_dump -Fc -f "${DEST}/db.dump"
  if [ -d /uploads ]; then
    cp -a /uploads "${DEST}/uploads"
  fi
  if [ -d /uploads-storage ]; then
    cp -a /uploads-storage "${DEST}/uploads-storage"
  fi
  if [ -d /wa-auth ]; then
    cp -a /wa-auth "${DEST}/wa-auth"
  fi
  echo "[backup] OK ${DEST}"

  # prune: keep newest RETENTION_DAYS daily-* dirs
  i=0
  # shellcheck disable=SC2012
  for d in $(ls -1dt "${OUT_ROOT}"/daily-* 2>/dev/null || true); do
    i=$((i + 1))
    if [ "$i" -gt "$RETENTION_DAYS" ]; then
      echo "[backup] prune $d"
      rm -rf "$d"
    fi
  done

  sleep 86400
done
