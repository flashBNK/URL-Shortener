import pytest

from infrastructure.databases.postgresql.models import Link, User
from domain.user.crypto import context


@pytest.mark.asyncio
async def test_find_link_success(client, session):

    user = User(
        username="finduser",
        email="finduser@example.com",
        password=context.hash("Password123"),
    )

    session.add(user)
    await session.flush()

    link = Link(
        short_url="test123",
        url="https://example.com",
        total=15,
        is_active=True,
        expires_at=None,
        user_id=user.id,
    )

    session.add(link)

    response = await client.get(
        "/api/v1/link/test123"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["short_url"] == "test123"
    assert data["url"] == "https://example.com"
    assert data["total"] == 15
    assert data["is_active"] is True
    assert data["user_id"] == user.id


@pytest.mark.asyncio
async def test_find_link_not_found(client):

    response = await client.get(
        "/api/v1/link/unknown123"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Link not found"