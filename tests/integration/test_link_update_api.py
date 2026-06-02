import pytest

from app import app
from api.v1.user.dependencies import get_current_user_optional
from domain.user.crypto import context
from infrastructure.databases.postgresql.models import User, Link
from unittest.mock import AsyncMock, patch


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
    await session.commit()

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
    await session.commit()

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
    await session.commit()

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