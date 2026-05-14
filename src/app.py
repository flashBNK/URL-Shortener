from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from middlewares.time_middleware import TimingMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from settings import settings
from api.v1.routers import router
from api.v1.link.views import short_router
from container import Container
from limiter import limiter

container = Container()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Код до yield выполняется один раз на старте (инициализация ресурсов: БД, кэш, клиенты).


    sessionmanager = container.session_manager()
    sessionmanager.init(settings.database.get_database_url())


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


    # # --- startup: создаём таблицы один раз (идемпотентно) ---
    # async with sessionmanager.connect() as connection:
    #     await sessionmanager.create_all(connection)


app = FastAPI(lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = (["*"] if settings.app.debug else ["https://mydomain.com", "https://www.mydomain.com"])
app.add_middleware(TimingMiddleware)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

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