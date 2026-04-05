# Обновление тестового стенда на TrueNAS (NAS)

Кратко: изменения в коде попадают в GitHub → на NAS выполняется `git pull` и скрипт деплоя, который пересобирает backend/frontend и перезапускает API.

Предполагается, что первичный деплой уже сделан по [README.md](README.md) (клон, `.env`, systemd, nginx).

---

## 1. На своём компьютере (разработка)

1. Внесите правки в проект.
2. Закоммитьте и отправьте в GitHub:

   ```bash
   git add -A
   git commit -m "краткое описание изменений"
   git push origin main
   ```

3. Убедитесь, что ветка **`main`** на GitHub содержит нужный коммит (веб-интерфейс GitHub или `git log`).

---

## 2. На NAS по SSH

### 2.1. Подключение

Зайдите под пользователем деплоя (например `truenas_admin`). Если SSH ругается на «Too many authentication failures», используйте:

```bash
ssh -o IdentitiesOnly=yes -o PubkeyAuthentication=no -o PreferredAuthentications=password USER@IP_NAS
```

### 2.2. Node (nvm)

Если Node не в PATH в новой сессии:

```bash
source ~/.zshrc
node -v
```

### 2.3. Переход в каталог клона

Подставьте **ваш** путь к репозиторию на пуле, например:

```bash
cd /mnt/StoragePool/app/app
```

Проверка: должны существовать `backend/`, `frontend/`, `deploy/truenas/deploy.sh`.

### 2.4. Запуск обновления

```bash
export SYSTEMD_UNIT=bulk-cargo-backend
bash deploy/truenas/deploy.sh
```

Скрипт последовательно:

- выполняет **`git pull`** (обновление с GitHub);
- в **`backend`**: `npm ci`, `prisma generate`, `build`, **`prisma db push`** (схема SQLite подтягивается к `schema.prisma`);
- в **`frontend`**: `npm ci`, `npm run build` (новая статика в `frontend/dist`);
- перезапускает systemd-юнит **`bulk-cargo-backend`**.

**Nginx** после обычного обновления кода **перезагружать не нужно**: он отдаёт уже обновлённые файлы из `dist` с диска.

### 2.5. Переменные скрипта (редко)

| Переменная | Назначение |
|------------|------------|
| `SKIP_GIT_PULL=1` | не делать `git pull` (например код уже обновлён вручную) |
| `RELOAD_NGINX=1` | после деплоя выполнить `nginx -t` и `reload` (нужен `sudo` без пароля для nginx) |

Пример без pull:

```bash
export SYSTEMD_UNIT=bulk-cargo-backend
export SKIP_GIT_PULL=1
bash deploy/truenas/deploy.sh
```

---

## 3. Если менялись только секреты или `.env`

Файл **`backend/.env`** на NAS **не хранится в Git**. Правки делайте на сервере:

```bash
nano /mnt/ВАШ_ПУТЬ/app/backend/.env
sudo systemctl restart bulk-cargo-backend
```

Пересборка фронта не обязательна, если менялись только переменные бэкенда.

---

## 4. Проверка после обновления

```bash
curl -sS http://127.0.0.1:3001/health
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/
```

Ожидается ответ health с `"ok":true` и HTTP **200** для главной страницы приложения (порт у вас может отличаться).

В браузере: жёсткое обновление (**Ctrl+Shift+R** / очистка кэша), если видите старую версию фронта.

---

## 5. Автоматизация через GitHub Actions

В репозитории есть **`.github/workflows/deploy-truenas.yml`**. По умолчанию может быть включён только ручной запуск (**workflow_dispatch**).

Требуется:

- секреты **`TRUENAS_HOST`**, **`TRUENAS_USER`**, **`TRUENAS_SSH_KEY`**, **`TRUENAS_APP_PATH`**;
- доступность NAS для раннера GitHub (белый IP, VPN, Tailscale или **self-hosted runner** на вашей сети).

Облачный раннер **не достучится** до `192.168.x.x` без туннеля или проброса порта.

---

## 6. Заметки

- **Сид БД** (`npm run db:seed`) при обновлении **обычно не запускают** — он пересоздаёт тестовые данные. Нужен только осознанно.
- После изменения **`schema.prisma`** скрипт делает **`prisma db push`**; для продакшена с миграциями позже может понадобиться отдельный процесс (`migrate deploy`).
- Вход по **HTTP** и cookie: если сессия «не прилипает», см. раздел про **`NODE_ENV` / Secure cookie** в [README.md](README.md) и комментарии в `deploy/truenas/backend.env.example`.

---

## 7. Что делать при ошибке деплоя

1. Прочитайте вывод **`deploy.sh`** до конца (ошибка `npm`, Prisma, git).
2. **`sudo systemctl status bulk-cargo-backend`** и при необходимости **`sudo journalctl -u bulk-cargo-backend -n 50 --no-pager`**.
3. **`git status`** и **`git pull`** в каталоге клона — нет ли локальных конфликтов или незакоммиченных правок на NAS.
