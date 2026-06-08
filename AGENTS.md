# Repository Guidelines

## Язык и формат общения
Все объяснения для пользователя давайте на русском языке. Технические имена файлов, путей, команд, переменных, классов, функций, модулей и кода оставляйте как есть: `src/app.py`, `pytest -q`, `FastAPI`, `Container`.

Перед изменением backend кратко объясните, зачем это нужно и какое поведение затрагивается. Не меняйте существующий backend без явной необходимости: избегайте побочных рефакторингов, переименований и перестройки слоев.

## Структура проекта
Это Python 3.13 URL shortener API на `FastAPI`, `SQLAlchemy`, `Alembic`, `Redis` и `PostgreSQL`. Код приложения находится в `src/`. Роуты и схемы лежат в `src/api/v1/`, сценарии в `src/usecases/`, доменные модели и интерфейсы в `src/domain/`, реализации БД и кеша в `src/infrastructure/`. Миграции `Alembic` находятся в `src/migrations/versions/`.

Тесты лежат в `tests/` и разделены на `unit/`, `integration/` и `smoke/`. Общие фикстуры и фабрики находятся в `tests/conftest.py` и `tests/fixtures/`. Конфигурационные примеры лежат в `config/`.

Если нужен frontend, создавайте его отдельно в папке `frontend/`. Не смешивайте frontend-код с существующим backend в `src/`.

## Команды разработки
Установить зависимости:

```bash
pip install -r requirements.txt
```

Запустить API локально из `src/`:

```bash
uvicorn app:app --reload
```

Запустить PostgreSQL, Redis и приложение:

```bash
docker compose -f build/docker-compose.yml up --build
```

Проверки, используемые в CI:

```bash
ruff check src/
pytest -q
```

Миграции управляются через `Makefile`: `make new m="add table"` создает revision, `make up` обновляет БД до `head`, `make down r=0007` откатывает до указанной revision.

## Стиль кода
Используйте отступы в 4 пробела и type hints. Соблюдайте слоистую архитектуру: API вызывает use cases, use cases зависят от domain abstractions, infrastructure содержит реализации persistence/cache. Используйте `snake_case` для функций, переменных, модулей и тестов; `PascalCase` для классов и Pydantic-схем.

`ruff.toml` задает `line-length = 120`, `target-version = "py313"` и правила `E`, `F`, `I`. Перед PR запускайте `ruff check src/`.

## Тестирование и проверки
`pytest` настроен с `asyncio_mode = auto`, `pythonpath = src`, `testpaths = tests`. Имена тестовых файлов должны быть `test_*.py`, имена тестов должны описывать поведение, например `test_create_link_requires_auth`.

После изменений запускайте релевантные проверки и кратко объясняйте результат. Минимум для backend: `ruff check src/` и `pytest -q`. Если проверку запустить нельзя, явно укажите причину.

## Commit и Pull Request
История использует короткие описательные сообщения: `Fix CI database url for tests`, `added test_short_code and test_safe_browsing`. Делайте commits сфокусированными.

В PR добавляйте краткое описание, issue при наличии, заметки о миграциях и список выполненных проверок.

## Безопасность и конфигурация
Реальные секреты храните только локально в `config/.env`. Для общих значений используйте `config/.env.example` или `config/.env.test`. При добавлении settings обновляйте примеры и переменные Docker Compose/CI.
