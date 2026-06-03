import pytest

from app import app
from api.v1.user.dependencies import get_current_user_optional
from domain.user.crypto import context
from infrastructure.databases.postgresql.models.user import User


@pytest.mark.asyncio
async def test_update_user_success(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="oldname",
        email="oldname@example.com",
        password=context.hash("StrongPass1"),
    )
    session.add(user)
    await session.flush()

    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "oldname",
            "password": "StrongPass1",
        },
    )
    assert login_response.status_code == 201

    access_token = login_response.json()["access_token"]

    response = await client.patch(
        "/api/v1/user",
        json={
            "username": "newname",
            "email": "newname@example.com",
        },
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["username"] == "newname"
    assert data["email"] == "newname@example.com"


@pytest.mark.asyncio
async def test_update_user_unauthorized(client):

    response = await client.patch(
        "/api/v1/user",
        json={
            "username": "newname",
            "email": "new@example.com",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "You do not have permission to modify this object."
    )


@pytest.mark.asyncio
async def test_update_user_conflict(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user1 = User(
        username="user1",
        email="user1@example.com",
        password=context.hash("Password123"),
    )

    user2 = User(
        username="user2",
        email="user2@example.com",
        password=context.hash("Password123"),
    )

    session.add_all([user1, user2])
    await session.flush()

    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "user1",
            "password": "Password123",
        },
    )

    access_token = login_response.json()["access_token"]

    response = await client.patch(
        "/api/v1/user",
        json={
            "username": "user2",
            "email": "user2@example.com",
        },
        headers={
            "Authorization": f"Bearer {access_token}"
        },
    )

    assert response.status_code == 409