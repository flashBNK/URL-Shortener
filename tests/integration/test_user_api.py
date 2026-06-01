import pytest
from sqlalchemy import select

from infrastructure.databases.postgresql.models.user import User
from tests.fixtures.factories import make_user_payload


@pytest.mark.asyncio
async def test_create_user_success(client, session):
    payload = make_user_payload(
        username="testuser1",
        email="testuser1@example.com",
        password="StrongPass1",
    )

    response = await client.post("/api/v1/user", json=payload)

    assert response.status_code == 201

    data = response.json()
    assert data["username"] == payload["username"]
    assert data["email"] == payload["email"]
    assert data["is_active"] is True
    assert "id" in data
    assert "created_at" in data

    result = await session.execute(
        select(User).where(User.email == payload["email"])
    )
    db_user = result.scalar_one()

    assert db_user.username == payload["username"]
    assert db_user.email == payload["email"]
    assert db_user.password != payload["password"]


@pytest.mark.asyncio
async def test_create_user_duplicate_email_returns_409(client):
    payload = make_user_payload(
        username="testuser2",
        email="duplicate@example.com",
        password="StrongPass1",
    )

    first = await client.post("/api/v1/user", json=payload)
    assert first.status_code == 201

    second = await client.post("/api/v1/user", json=payload)
    assert second.status_code == 409
    assert "already exists" in second.json()["detail"].lower()