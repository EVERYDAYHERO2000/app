#!/usr/bin/env bash
# Запускать на TrueNAS (SCALE) из корня клона репозитория или через:
#   cd /path/to/app && bash deploy/truenas/deploy.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${ROOT}"

echo "==> Repo: ${ROOT}"

if [[ ! -f "${ROOT}/backend/package.json" ]]; then
  echo "error: backend/package.json not found. Clone the app repo first." >&2
  exit 1
fi

# Опционально: обновить код с GitHub (если деплой не из CI с уже свежим checkout)
if [[ "${SKIP_GIT_PULL:-}" != "1" ]]; then
  echo "==> git pull"
  git pull --ff-only
fi

echo "==> backend: install, prisma, build"
cd "${ROOT}/backend"
npm ci
npx prisma generate
npm run build
npx prisma db push

echo "==> frontend: install, build (API через /api на том же хосте)"
cd "${ROOT}/frontend"
npm ci
npm run build

if [[ -n "${SYSTEMD_UNIT:-}" ]]; then
  echo "==> restart systemd: ${SYSTEMD_UNIT}"
  if sudo systemctl restart "${SYSTEMD_UNIT}" 2>/dev/null; then
    :
  elif systemctl --user restart "${SYSTEMD_UNIT}" 2>/dev/null; then
    :
  else
    echo "warning: could not restart ${SYSTEMD_UNIT}; start manually: cd backend && npm run start" >&2
  fi
fi

if [[ "${RELOAD_NGINX:-}" == "1" ]]; then
  echo "==> nginx test + reload"
  sudo nginx -t && sudo systemctl reload nginx
fi

echo "==> deploy finished"
