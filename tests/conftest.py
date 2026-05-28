import os
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app import app
from infrastructure.databases.postgresql.base import Base
from infrastructure.databases.postgresql.session import get_async_session
from api.v1.user.dependencies import get_current_user_optional


def load_env_file(path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError(f"Missing env file: {path}")

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ[key.strip()] = value.strip().strip('"').strip("'")


ROOT = Path(__file__).resolve().parents[1]
load_env_file(ROOT / "config" / ".env.test")


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