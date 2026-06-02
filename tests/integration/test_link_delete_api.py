import pytest

from api.v1.user.dependencies import get_current_user_optional
from infrastructure.databases.postgresql.models import Link, User
from domain.user.crypto import context
from app import app
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_delete_link_success(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="deleteuser",
        email="deleteuser@example.com",
        password=context.hash("Password123"),
    )

    session.add(user)
    await session.flush()

    link = Link(
        short_url="delete123",
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
            "username": "deleteuser",
            "password": "Password123",
        },
    )

    access_token = login_response.json()["access_token"]

    with patch(
            "infrastructure.redis.link_cache.LinkCache.delete",
            new_callable=AsyncMock,
    ):
        response = await client.delete(
            "/api/v1/link/delete123",
            headers={
                "Authorization": f"Bearer {access_token}"
            },
        )

    assert response.status_code == 204

@pytest.mark.asyncio
async def test_delete_link_unauthorized(client):

    response = await client.delete(
        "/api/v1/link/somelink"
    )

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "You do not have permission to modify this object."
    )


@pytest.mark.asyncio
async def test_delete_link_access_denied(client, session):

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

    response = await client.delete(
        "/api/v1/link/private123",
        headers={
            "Authorization": f"Bearer {access_token}"
        },
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_link_not_found(client, session):
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

    with patch(
            "infrastructure.redis.link_cache.LinkCache.delete",
            new_callable=AsyncMock,
    ):
        response = await client.delete(
            "/api/v1/link/delete123",
            headers={
                "Authorization": f"Bearer {access_token}"
            },
        )

    assert response.status_code == 404
    assert response.json()["detail"] == "Link not found"