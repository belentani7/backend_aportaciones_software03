#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="${ROOT}/data/backups"
ARCHIVE="${BACKUP_DIR}/commerce_${STAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"
cd "${ROOT}"
docker compose exec -T postgres pg_dump -U "$(grep '^POSTGRES_USER=' .env | cut -d= -f2-)" "$(grep '^POSTGRES_DB=' .env | cut -d= -f2-)" | gzip -9 > "${ARCHIVE}"
gzip -t "${ARCHIVE}"
find "${BACKUP_DIR}" -type f -name 'commerce_*.sql.gz' -mtime +30 -delete
printf '%s\n' "${ARCHIVE}"
