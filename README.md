# URL-Shortener

## Production Deploy

Production setup находится в файлах:

- `build/docker-compose.prod.yml` - сервисы Caddy, backend, PostgreSQL и Redis.
- `deploy/Caddyfile` - HTTPS reverse proxy и маршрутизация SPA/API/short links.
- `frontend/Dockerfile` - build stage для Vite и итоговый Caddy static image.
- `.env.prod.example` - шаблон production env. Реальный `.env.prod` не коммитить.

Создайте env-файл на VPS:

```bash
cp .env.prod.example .env.prod
```

В `.env.prod` замените минимум:

- `DOMAIN`
- `APP_FRONTEND_BASE_URL`
- `APP_CORS_ORIGINS`
- `VITE_API_BASE_URL`
- `APP_SECRET_KEY`
- `APP_SAFE_BROWSING_API_KEY`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `REDIS_URL`

Для деплоя на одном домене держите эти значения согласованными:

```bash
DOMAIN=example.com
APP_FRONTEND_BASE_URL=https://example.com
APP_CORS_ORIGINS=https://example.com
VITE_API_BASE_URL=https://example.com
```

Запуск production stack:

```bash
docker compose -f build/docker-compose.prod.yml --env-file .env.prod up -d --build
```

Миграции для новой БД или после `git pull` с новыми миграциями:

```bash
docker compose -f build/docker-compose.prod.yml --env-file .env.prod run --rm backend alembic upgrade head
```

Логи:

```bash
docker compose -f build/docker-compose.prod.yml --env-file .env.prod logs -f
```

Остановка:

```bash
docker compose -f build/docker-compose.prod.yml --env-file .env.prod down
```

Обновление после `git pull`:

```bash
git pull
docker compose -f build/docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f build/docker-compose.prod.yml --env-file .env.prod run --rm backend alembic upgrade head
```

Caddy routing:

- `/api/v1/*`, `/docs`, `/openapi.json`, `/redoc` идут в FastAPI `backend:8000`.
- `/assets/*` и `/favicon.ico` отдаются как static files.
- `/`, `/dashboard`, `/public`, `/check`, `/account`, `/login`, `/register`, `/links/*`, `/404` используют SPA fallback.
- Legacy JSON endpoint `/public` проксируется в backend только для non-HTML запросов, потому что текущий frontend использует его для списка публичных ссылок.
- Остальные неизвестные пути идут в FastAPI, чтобы `/{short_url}` продолжал работать.
