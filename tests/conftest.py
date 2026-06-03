import os
import pytest
import pytest_asyncio

from pathlib import Path
from dotenv import load_dotenv
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from sqlalchemy import text

from app import app, container
from infrastructure.databases.postgresql.base import Base
from infrastructure.databases.postgresql.session import get_async_session
from api.v1.user.dependencies import get_current_user_optional
from limiter import limiter



ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / "config" / ".env.test")


@pytest_asyncio.fixture(scope="session")
async def engine():
    engine = create_async_engine(
        os.environ["DATABASE_URL"],
        echo=False,
        poolclass=NullPool,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture()
async def session(engine):
    SessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with SessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture(scope="session", autouse=True)
def wire_container():
    container.wire(
        modules=[
            "infrastructure.databases.postgresql.session",
            "api.v1.link.dependencies",
            "api.v1.user.dependencies",
        ]
    )
    yield


@pytest_asyncio.fixture()
async def client(session):
    async def override_get_async_session():
        yield session

    async def override_get_current_user_optional():
        return None

    app.dependency_overrides[get_async_session] = override_get_async_session
    app.dependency_overrides[get_current_user_optional] = override_get_current_user_optional

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def disable_rate_limit():
    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest_asyncio.fixture(autouse=True)
async def clean_database(engine):
    async with engine.begin() as conn:
        await conn.execute(text(
            'TRUNCATE TABLE link_click, link, token, "user" RESTART IDENTITY CASCADE'
        ))
    yield