FROM python:3.13-slim

# Отключаем .pyc файлы и буферизацию stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src

WORKDIR /app

# Сначала только requirements — этот слой кэшируется
# При изменении кода Docker не будет переустанавливать зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Теперь копируем сам проект (без лишнего — см. .dockerignore)
COPY config/config.yaml ./config/config.yaml
COPY src/ ./src/
COPY alembic.ini .

# Non-root пользователь для безопасности
RUN groupadd -r appgroup && \
    useradd -r -g appgroup appuser && \
    chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

#HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
#    CMD python -c "import httpx; httpx.get('http://localhost:8000/health').raise_for_status()"

# prod: uvicorn без hot reload
# dev:  переопределяется в docker-compose через command: fastapi dev ...
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]

