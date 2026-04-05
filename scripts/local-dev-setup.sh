#!/usr/bin/env bash
# Настройка локальной разработки без Docker.
# База данных: SQLite (файл создается автоматически).
# Запуск из корня репозитория: bash scripts/local-dev-setup.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f "$ROOT/backend/.env" ]; then
  cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
  echo "==> Создан backend/.env из .env.example"
fi

cd "$ROOT/backend"
echo "==> npm install (backend)"
npm install
echo "==> prisma generate"
npx prisma generate
echo "==> prisma db push"
npx prisma db push --accept-data-loss
echo "==> db seed"
npm run db:seed

cd "$ROOT/frontend"
echo "==> npm install (frontend)"
npm install

if [ ! -f "$ROOT/frontend/.env" ] && [ -f "$ROOT/frontend/.env.example" ]; then
  cp "$ROOT/frontend/.env.example" "$ROOT/frontend/.env"
  echo "==> Создан frontend/.env из .env.example"
fi

echo ""
echo "Готово. Запуск в двух терминалах:"
echo "  1) cd backend && npm run dev"
echo "  2) cd frontend && npm run dev"
echo "Фронт: http://localhost:5173"
