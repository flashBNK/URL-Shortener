import pytest

from app import app
from api.v1.user.dependencies import get_current_user_optional
from domain.user.crypto import context
from infrastructure.databases.postgresql.models import User, Link


@pytest.mark.asyncio
async def test_links_me_success(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="linksuser",
        email="links@example.com",
        password=context.hash("Password123"),
    )

    session.add(user)
    await session.flush()

    link1 = Link(
        short_url="abc123",
        url="https://google.com",
        total=10,
        is_active=True,
        expires_at=None,
        user_id=user.id,
    )

    link2 = Link(
        short_url="xyz789",
        url="https://youtube.com",
        total=5,
        is_active=False,
        expires_at=None,
        user_id=user.id,
    )

    session.add(link2)
    session.add(link1)

    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "linksuser",
            "password": "Password123",
        },
    )

    access_token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/link/me",
        headers={
            "Authorization": f"Bearer {access_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 2
    assert len(data["items"]) == 2

    assert data["items"][0]["short_url"] == "abc123"
    assert data["items"][1]["short_url"] == "xyz789"


@pytest.mark.asyncio
async def test_links_me_unauthorized(client):

    response = await client.get("/api/v1/link/me")

    assert response.status_code == 401
    assert response.json()["detail"] == (
        "You must be signed in to access"
    )


@pytest.mark.asyncio
async def test_links_me_empty_list(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="emptyuser",
        email="empty@example.com",
        password=context.hash("Password123"),
    )

    session.add(user)

    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "emptyuser",
            "password": "Password123",
        },
    )

    access_token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/link/me",
        headers={
            "Authorization": f"Bearer {access_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 0
    assert data["items"] == []