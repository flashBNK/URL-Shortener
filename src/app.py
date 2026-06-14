from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.v1.link.views import short_router
from api.v1.routers import router
from container import Container
from infrastructure.redis.client import redis_client
from limiter import limiter
from logger import get_logger, setup_logging
from middlewares.log_middleware import LoggingMiddleware
from middlewares.time_middleware import TimingMiddleware
from settings import settings

container = Container()

log = get_logger("app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Код до yield выполняется один раз на старте (инициализация ресурсов: БД, кэш, клиенты).


    setup_logging(settings.app.debug)
    log.info("application started", host=settings.app.host, port=settings.app.port)

    sessionmanager = container.session_manager()
    sessionmanager.init(settings.database.get_database_url())

    redis_client.init(settings.redis_url)
    container.link_cache.reset()


    container.wire(
        modules=[
            "infrastructure.databases.postgresql.session",
            "api.v1.link.dependencies",
        ]
    )

    try:
        yield

        # Код после yield выполняется при остановке (корректно закрываем соединения, пулы и т.д.).
    finally:
        # --- shutdown: корректно закрываем пул соединений ---
        await sessionmanager.close()
        await redis_client.close()
        log.info("application shutdown")


    # # --- startup: создаём таблицы один раз (идемпотентно) ---
    # async with sessionmanager.connect() as connection:
    #     await sessionmanager.create_all(connection)


app = FastAPI(lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(LoggingMiddleware)
app.add_middleware(TimingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.app.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(short_router, tags=["Short"])

# if __name__ == "__main__":
#     uvicorn.run(
#         "app:app",
#         host="0.0.0.0",
#         port=8000,
#         workers=4,
#         reload=True,
#     )