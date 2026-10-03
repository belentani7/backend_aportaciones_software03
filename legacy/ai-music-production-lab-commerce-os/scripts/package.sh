#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="${ROOT}/dist"
ARCHIVE="${OUT_DIR}/ai_music_production_lab_${STAMP}.zip"

mkdir -p "${OUT_DIR}"
cd "${ROOT}"
zip -r "${ARCHIVE}" . \
  -x ".git/*" \
  -x ".env" \
  -x "data/*" \
  -x "dist/*" \
  -x "*/__pycache__/*" \
  -x "*.pyc" \
  -x ".pytest_cache/*" \
  -x "monitoring/logs/*" \
  -x "monitoring/*.png" \
  -x "*.log" >/dev/null
unzip -t "${ARCHIVE}" >/dev/null
printf '%s\n' "${ARCHIVE}"
