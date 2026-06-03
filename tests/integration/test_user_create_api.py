import pytest

from infrastructure.databases.postgresql.models import User


@pytest.mark.asyncio
async def test_create_user_success(client):
    response = await client.post(
        "/api/v1/user",
        json={
            "username": "testuser1",
            "email": "testuser1@example.com",
            "password": "StrongPass1",
        },
    )

    assert response.status_code == 201

    data = response.json()
    assert data["username"] == "testuser1"
    assert data["email"] == "testuser1@example.com"
    assert "id" in data
    assert "created_at" in data



@pytest.mark.asyncio
async def test_create_user_duplicate_username(client, session):
    first = User(
        username="dupuser",
        email="dupuser1@example.com",
        password="hashed-password-1",
    )
    session.add(first)
    await session.commit()

    response = await client.post(
        "/api/v1/user",
        json={
            "username": "dupuser",
            "email": "dupuser2@example.com",
            "password": "StrongPass1",
        },
    )

    assert response.status_code == 409


@pytest.mark.asyncio
async def test_create_user_short_username(client):
    response = await client.post(
        "/api/v1/user",
        json={
            "username": "abc",
            "email": "short@example.com",
            "password": "StrongPass1",
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_user_weak_password(client):
    response = await client.post(
        "/api/v1/user",
        json={
            "username": "weakpassuser",
            "email": "weakpass@example.com",
            "password": "Password",  # без цифры
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_user_invalid_email(client):
    response = await client.post(
        "/api/v1/user",
        json={
            "username": "bademailuser",
            "email": "not-an-email",
            "password": "StrongPass1",
        },
    )

    assert response.status_code == 422