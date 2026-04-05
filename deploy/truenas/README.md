# Деплой на TrueNAS SCALE

Стек: Node (backend), статика Vite (frontend), SQLite через Prisma. В браузере фронт и API с одного хоста: nginx отдаёт `frontend/dist`, запросы `/api/*` проксируются на backend (`PORT`, по умолчанию 3001).

## 1. Один раз на TrueNAS (по SSH)

### Node.js

Установите **Node.js LTS** (версия как в `.nvmrc` в корне репозитория — предпочтительно совпадение major).

Пример через [NodeSource](https://github.com/nodesource/distributions) или `nvm` в домашнем каталоге пользователя деплоя. Для systemd укажите **полный путь к `node`** в unit-файле или добавьте `PATH` в `[Service]`.

### Клон репозитория

Выберите каталог на пуле (dataset), например:

```bash
sudo mkdir -p /mnt/ВАШ_ПУЛ/apps
sudo chown "$USER:$USER" /mnt/ВАШ_ПУЛ/apps
cd /mnt/ВАШ_ПУЛ/apps
git clone git@github.com:EVERYDAYHERO2000/app.git
cd app
```

Для приватного репозитория на NAS добавьте [deploy key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys#deploy-keys) (только read).

### Переменные backend

```bash
cp deploy/truenas/backend.env.example backend/.env
nano backend/.env
```

Обязательно: `SESSION_SECRET`, `FRONTEND_URL` (как пользователь открывает сайт в браузере, например `http://192.168.1.10:8080` или `https://bulk-cargo.example.com`).  
`DATABASE_URL` по умолчанию — `file:./prisma/prod.db` (файл на диске рядом со схемой Prisma).

Первый запуск БД и при необходимости тестовые пользователи:

```bash
cd backend
npm ci
npx prisma generate
npx prisma db push
npm run db:seed   # опционально
```

### systemd — сервис API

```bash
sudo cp deploy/truenas/bulk-cargo-backend.service.example /etc/systemd/system/bulk-cargo-backend.service
sudo nano /etc/systemd/system/bulk-cargo-backend.service
```

Замените `DEPLOY_USER`, все `/ABS/PATH/TO/app`, при необходимости путь к `node` и `Environment=PATH=...`.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now bulk-cargo-backend
curl -sS http://127.0.0.1:3001/health
```

### nginx — фронт + `/api`

Установите nginx (зависит от окружения SCALE; при необходимости используйте пакетный менеджер хоста или контейнер с пробросом порта).

```bash
sudo cp deploy/truenas/nginx-bulk-cargo.conf.example /etc/nginx/sites-available/bulk-cargo.conf
sudo nano /etc/nginx/sites-available/bulk-cargo.conf
```

Подставьте `root` на **абсолютный** путь к `frontend/dist` внутри клона. Порт `listen` (пример — `8080`) согласуйте с `FRONTEND_URL` в `backend/.env`.

```bash
sudo ln -sf /etc/nginx/sites-available/bulk-cargo.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Соберите фронт и перезапустите backend хотя бы раз (или выполните полный `deploy.sh` ниже).

### Фаервол

Откройте порт, на котором слушает nginx (например 8080), в правилах TrueNAS / маршрутизатора при необходимости.

---

## 2. Обновление приложения (ручной деплой)

Из корня клона:

```bash
export SYSTEMD_UNIT=bulk-cargo-backend
bash deploy/truenas/deploy.sh
```

Скрипт делает `git pull`, сборку backend/frontend, `prisma db push`, перезапуск unit.  
Переменные:

| Переменная | Значение |
|------------|----------|
| `SKIP_GIT_PULL=1` | не выполнять `git pull` (редко нужно) |
| `SYSTEMD_UNIT` | имя unit для перезапуска |
| `RELOAD_NGINX=1` | `nginx -t` и reload (нужен `sudo` без запроса пароля для этих команд) |

---

## 3. Деплой из GitHub Actions

Файл: `.github/workflows/deploy-truenas.yml`.

**Важно:** раннеры GitHub в облаке **не видят** ваш NAS по частному `192.168.x.x`, пока вы не настроите один из вариантов:

- белый IP и проброс SSH;
- **Tailscale** / другой VPN на NAS и на раннере (в т.ч. [self-hosted runner](https://docs.github.com/en/actions/hosting-your-own-runners));
- деплой только вручную (`workflow_dispatch`), когда вы на своей машине в той же сети запускаете скрипт по SSH.

Секреты репозитория (**Settings → Secrets and variables → Actions**):

| Секрет | Описание |
|--------|----------|
| `TRUENAS_HOST` | хост или IP, доступный раннеру |
| `TRUENAS_USER` | SSH-пользователь |
| `TRUENAS_SSH_KEY` | приватный ключ (весь PEM), парный к `authorized_keys` на NAS |
| `TRUENAS_APP_PATH` | абсолютный путь к клону, например `/mnt/pool/apps/app` |

После заполнения секретов раскомментируйте триггер `push` в workflow (или запускайте **Run workflow** вручную).

---

## 4. Частые проблемы

- **CORS / cookies:** `FRONTEND_URL` должен совпадать с тем, что в адресной строке (схема, хост, порт).
- **502 на `/api`:** backend не слушает `3001` или nginx не проксирует (проверьте `curl http://127.0.0.1:3001/health`).
- **Пустая страница SPA:** в nginx нужен `try_files ... /index.html` (как в примере).
