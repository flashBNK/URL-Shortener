import pytest

from app import app
from api.v1.user.dependencies import get_current_user_optional
from domain.user.crypto import context
from infrastructure.databases.postgresql.models.user import User



@pytest.mark.asyncio
async def test_delete_user_success(client, session):

    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="deleteuser",
        email="delete@example.com",
        password=context.hash("Password123"),
    )

    session.add(user)
    await session.flush()
    await session.commit()

    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "deleteuser",
            "password": "Password123",
        },
    )

    assert login_response.status_code == 201

    access_token = login_response.json()["access_token"]

    response = await client.request(
        "DELETE",
        "/api/v1/user",
        json={
            "current_password": "Password123"
        },
        headers={
            "Authorization": f"Bearer {access_token}"
        },
    )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_user_unauthorized(client):

    response = await client.request(
        "DELETE",
        "/api/v1/user",
        json={
            "current_password": "Password123"
        },
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_user_wrong_password(client, session):

    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="wrongpassuser",
        email="wrongpass@example.com",
        password=context.hash("CorrectPassword123"),
    )

    session.add(user)
    await session.flush()
    await session.commit()

    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "wrongpassuser",
            "password": "CorrectPassword123",
        },
    )

    access_token = login_response.json()["access_token"]

    response = await client.request(
        "DELETE",
        "/api/v1/user",
        json={
            "current_password": "WrongPassword123"
        },
        headers={
            "Authorization": f"Bearer {access_token}"
        },
    )

    assert response.status_code == 401