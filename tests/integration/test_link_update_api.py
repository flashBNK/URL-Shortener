import pytest
from datetime import UTC, datetime, timedelta

from app import app
from api.v1.user.dependencies import get_current_user_optional
from domain.user.crypto import context
from infrastructure.databases.postgresql.models import User, Link
from sqlalchemy import select
from unittest.mock import AsyncMock, patch


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


@pytest.mark.asyncio
async def test_update_link_success(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="updateuser",
        email="update@example.com",
        password=context.hash("Password123"),
    )

    session.add(user)
    await session.flush()

    link = Link(
        short_url="oldshort",
        url="https://example.com",
        total=0,
        is_active=True,
        expires_at=None,
        user_id=user.id,
    )

    session.add(link)

    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "updateuser",
            "password": "Password123",
        },
    )

    access_token = login_response.json()["access_token"]

    with patch(
            "infrastructure.redis.link_cache.LinkCache.delete",
            new_callable=AsyncMock,
    ):

        response = await client.patch(
            "/api/v1/link/oldshort",
            json={
                "short_url": "newshort",
                "is_active": False,
                "expires_at": None,
            },
            headers={
                "Authorization": f"Bearer {access_token}"
            },
        )

    assert response.status_code == 200

    data = response.json()

    assert data["short_url"] == "newshort"
    assert data["is_active"] is False
    assert data["url"] == "https://example.com"


@pytest.mark.asyncio
async def test_update_link_sets_expires_at(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="expiryuser",
        email="expiry@example.com",
        password=context.hash("Password123"),
    )
    session.add(user)
    await session.flush()

    link = Link(
        short_url="expiry1",
        url="https://example.com",
        total=0,
        is_active=True,
        expires_at=None,
        user_id=user.id,
    )
    session.add(link)

    login_response = await client.post(
        "/api/v1/auth/token",
        json={"username": "expiryuser", "password": "Password123"},
    )
    access_token = login_response.json()["access_token"]
    expires_at = datetime.now(UTC).replace(microsecond=0) + timedelta(days=3)

    with patch("infrastructure.redis.link_cache.LinkCache.delete", new_callable=AsyncMock):
        response = await client.patch(
            "/api/v1/link/expiry1",
            json={"expires_at": expires_at.isoformat()},
            headers={"Authorization": f"Bearer {access_token}"},
        )

    assert response.status_code == 200
    data = response.json()
    result = await session.execute(select(Link).where(Link.short_url == "expiry1"))
    db_link = result.scalar_one()

    assert data["expires_at"] is not None
    assert as_utc(datetime.fromisoformat(data["expires_at"])) == expires_at
    assert as_utc(db_link.expires_at) == expires_at

    get_response = await client.get("/api/v1/link/expiry1")
    assert get_response.status_code == 200
    assert as_utc(datetime.fromisoformat(get_response.json()["expires_at"])) == expires_at


@pytest.mark.asyncio
async def test_update_link_clears_expires_at_with_null(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="clearuser",
        email="clear@example.com",
        password=context.hash("Password123"),
    )
    session.add(user)
    await session.flush()

    link = Link(
        short_url="clear1",
        url="https://example.com",
        total=0,
        is_active=True,
        expires_at=datetime.now(UTC).replace(microsecond=0) + timedelta(days=2),
        user_id=user.id,
    )
    session.add(link)

    login_response = await client.post(
        "/api/v1/auth/token",
        json={"username": "clearuser", "password": "Password123"},
    )
    access_token = login_response.json()["access_token"]

    with patch("infrastructure.redis.link_cache.LinkCache.delete", new_callable=AsyncMock):
        response = await client.patch(
            "/api/v1/link/clear1",
            json={"expires_at": None},
            headers={"Authorization": f"Bearer {access_token}"},
        )

    assert response.status_code == 200
    assert response.json()["expires_at"] is None
    result = await session.execute(select(Link).where(Link.short_url == "clear1"))
    db_link = result.scalar_one()

    assert db_link.expires_at is None

    get_response = await client.get("/api/v1/link/clear1")
    assert get_response.status_code == 200
    assert get_response.json()["expires_at"] is None


@pytest.mark.asyncio
async def test_update_link_omits_expires_at_keeps_existing_value(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="keepuser",
        email="keep@example.com",
        password=context.hash("Password123"),
    )
    session.add(user)
    await session.flush()

    expires_at = datetime.now(UTC).replace(microsecond=0) + timedelta(days=4)
    link = Link(
        short_url="keep1",
        url="https://example.com",
        total=0,
        is_active=True,
        expires_at=expires_at,
        user_id=user.id,
    )
    session.add(link)

    login_response = await client.post(
        "/api/v1/auth/token",
        json={"username": "keepuser", "password": "Password123"},
    )
    access_token = login_response.json()["access_token"]

    with patch("infrastructure.redis.link_cache.LinkCache.delete", new_callable=AsyncMock):
        response = await client.patch(
            "/api/v1/link/keep1",
            json={"short_url": "keep2"},
            headers={"Authorization": f"Bearer {access_token}"},
        )

    assert response.status_code == 200
    data = response.json()
    result = await session.execute(select(Link).where(Link.short_url == "keep2"))
    db_link = result.scalar_one()

    assert data["short_url"] == "keep2"
    assert data["expires_at"] is not None
    assert as_utc(datetime.fromisoformat(data["expires_at"])) == expires_at
    assert as_utc(db_link.expires_at) == expires_at

    get_response = await client.get("/api/v1/link/keep2")
    assert get_response.status_code == 200
    assert as_utc(datetime.fromisoformat(get_response.json()["expires_at"])) == expires_at


@pytest.mark.asyncio
async def test_update_link_toggle_active_does_not_clear_expires_at(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="toggleuser",
        email="toggle@example.com",
        password=context.hash("Password123"),
    )
    session.add(user)
    await session.flush()

    expires_at = datetime.now(UTC).replace(microsecond=0) + timedelta(days=5)
    link = Link(
        short_url="toggle1",
        url="https://example.com",
        total=0,
        is_active=True,
        expires_at=expires_at,
        user_id=user.id,
    )
    session.add(link)

    login_response = await client.post(
        "/api/v1/auth/token",
        json={"username": "toggleuser", "password": "Password123"},
    )
    access_token = login_response.json()["access_token"]

    with patch("infrastructure.redis.link_cache.LinkCache.delete", new_callable=AsyncMock):
        response = await client.patch(
            "/api/v1/link/toggle1",
            json={"is_active": False},
            headers={"Authorization": f"Bearer {access_token}"},
        )

    assert response.status_code == 200
    data = response.json()
    result = await session.execute(select(Link).where(Link.short_url == "toggle1"))
    db_link = result.scalar_one()

    assert data["is_active"] is False
    assert as_utc(datetime.fromisoformat(data["expires_at"])) == expires_at
    assert db_link.is_active is False
    assert as_utc(db_link.expires_at) == expires_at


@pytest.mark.asyncio
async def test_update_link_unauthorized(client):

    response = await client.patch(
        "/api/v1/link/somelink",
        json={
            "short_url": "newlink",
            "is_active": False,
            "expires_at": None,
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "You do not have permission to modify this object."
    )


@pytest.mark.asyncio
async def test_update_link_access_denied(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user1 = User(
        username="owner",
        email="owner@example.com",
        password=context.hash("Password123"),
    )

    user2 = User(
        username="intruder",
        email="intruder@example.com",
        password=context.hash("Password123"),
    )

    session.add_all([user1, user2])
    await session.flush()

    link = Link(
        short_url="private123",
        url="https://example.com",
        total=0,
        is_active=True,
        expires_at=None,
        user_id=user1.id,
    )

    session.add(link)

    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "intruder",
            "password": "Password123",
        },
    )

    access_token = login_response.json()["access_token"]

    response = await client.patch(
        "/api/v1/link/private123",
        json={
            "short_url": "hackedlink",
            "is_active": False,
            "expires_at": None,
        },
        headers={
            "Authorization": f"Bearer {access_token}"
        },
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_link_not_found(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="notfounduser",
        email="notfound@example.com",
        password=context.hash("Password123"),
    )

    session.add(user)

    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "notfounduser",
            "password": "Password123",
        },
    )

    access_token = login_response.json()["access_token"]

    response = await client.patch(
        "/api/v1/link/unknown123",
        json={
            "short_url": "newshort",
            "is_active": False,
            "expires_at": None,
        },
        headers={
            "Authorization": f"Bearer {access_token}"
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Link not found"
