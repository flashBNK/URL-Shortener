import pytest
from sqlalchemy import select

from app import app
from api.v1.user.dependencies import get_current_user_optional
from domain.user.crypto import context
from infrastructure.databases.postgresql.models.user import User
from infrastructure.databases.postgresql.models.token import Token


@pytest.mark.asyncio
async def test_revoke_all_tokens_success(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="revokeuser",
        email="revokeuser@example.com",
        password=context.hash("StrongPass1"),
    )
    session.add(user)
    await session.flush()

    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "revokeuser",
            "password": "StrongPass1",
        },
    )
    assert login_response.status_code == 201

    access_token = login_response.json()["access_token"]

    revoke_response = await client.post(
        "/api/v1/auth/revoke-all",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert revoke_response.status_code == 204

    result = await session.execute(select(Token).where(Token.user_id == user.id))
    assert result.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_revoke_all_tokens_unauthorized(client):
    response = await client.post(
        "/api/v1/auth/revoke-all",
    )

    assert response.status_code == 401