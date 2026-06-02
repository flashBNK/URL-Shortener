import pytest

from sqlalchemy import select
from infrastructure.databases.postgresql.models.token import Token
from infrastructure.databases.postgresql.models.user import User
from domain.user.crypto import context


@pytest.mark.asyncio
async def test_refresh_token_success(client, session):
    user = User(
        username="refreshuser",
        email="refreshuser@example.com",
        password=context.hash("StrongPass1"),
    )
    session.add(user)
    await session.flush()
    await session.commit()

    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "refreshuser",
            "password": "StrongPass1",
        },
    )
    assert login_response.status_code == 201

    old_token_data = login_response.json()
    old_refresh_token = old_token_data["refresh_token"]

    refresh_response = await client.post(
        "/api/v1/auth/token/refresh",
        json={
            "refresh_token": old_refresh_token,
        },
    )

    assert refresh_response.status_code == 200

    new_token_data = refresh_response.json()
    assert "access_token" in new_token_data
    assert "refresh_token" in new_token_data
    assert new_token_data["refresh_token"] != old_refresh_token

    result = await session.execute(select(Token).where(Token.user_id == user.id))
    db_token = result.scalar_one()

    assert db_token.user_id == user.id


@pytest.mark.asyncio
async def test_refresh_token_not_found_returns_404(client):
    response = await client.post(
        "/api/v1/auth/token/refresh",
        json={
            "refresh_token": "invalid-refresh-token",
        },
    )

    assert response.status_code == 404
    assert "token is not found" in response.json()["detail"].lower()