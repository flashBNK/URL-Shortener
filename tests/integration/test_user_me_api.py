import pytest

from domain.user.crypto import context
from infrastructure.databases.postgresql.models.user import User


@pytest.mark.asyncio
async def test_get_user_me_success(client, session):
    user = User(
        username="meuser",
        email="meuser@example.com",
        password=context.hash("StrongPass1"),
    )
    session.add(user)
    await session.flush()
    await session.commit()

    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "meuser",
            "password": "StrongPass1",
        },
    )
    assert login_response.status_code == 201

    access_token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/user/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["username"] == "meuser"
    assert data["email"] == "meuser@example.com"
    assert data["is_active"] is True
    assert "created_at" in data


@pytest.mark.asyncio
async def test_bad_get_user_me_success(client, session):
    response = await client.get(
        "/api/v1/user/me",
        headers={"Authorization": f"Bearer None"},
    )

    assert response.status_code == 404