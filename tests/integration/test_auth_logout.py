import pytest
from sqlalchemy import select

from domain.user.crypto import context
from infrastructure.databases.postgresql.models.user import User
from infrastructure.databases.postgresql.models.token import Token


@pytest.mark.asyncio
async def test_logout_success(client, session):
    user = User(
        username="logoutuser",
        email="logoutuser@example.com",
        password=context.hash("StrongPass1"),
    )
    session.add(user)
    await session.flush()

    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "logoutuser",
            "password": "StrongPass1",
        },
    )
    assert login_response.status_code == 201

    access_token = login_response.json()["access_token"]

    logout_response = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert logout_response.status_code == 204

    result = await session.execute(select(Token).where(Token.user_id == user.id))
    token = result.scalar_one_or_none()

    assert token is None