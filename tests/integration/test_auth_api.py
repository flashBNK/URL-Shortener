import pytest
from sqlalchemy import select

from domain.user.crypto import context
from infrastructure.databases.postgresql.models.user import User
from infrastructure.databases.postgresql.models.token import Token


@pytest.mark.asyncio
async def test_login_user_success(client, session):
    user = User(
        username="loginuser",
        email="loginuser@example.com",
        password=context.hash("StrongPass1"),
    )
    session.add(user)
    await session.flush()

    response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "loginuser",
            "password": "StrongPass1",
        },
    )

    assert response.status_code == 201

    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert "access_token_expires_in" in data
    assert "refresh_token_expires_in" in data

    user_result = await session.execute(select(User).where(User.username == "loginuser"))
    db_user = user_result.scalar_one()
    assert db_user.id is not None

    token_result = await session.execute(select(Token).where(Token.user_id == db_user.id))
    db_token = token_result.scalar_one()
    assert db_token.user_id == db_user.id


@pytest.mark.asyncio
async def test_login_user_wrong_password_returns_401(client, session):
    user = User(
        username="loginuser2",
        email="loginuser2@example.com",
        password=context.hash("StrongPass1"),
    )
    session.add(user)
    await session.flush()

    response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "loginuser2",
            "password": "WrongPass1",
        },
    )

    assert response.status_code == 401
    assert "wrong password" in response.json()["detail"].lower()