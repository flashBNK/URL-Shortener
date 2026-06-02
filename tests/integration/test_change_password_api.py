import pytest
from unittest.mock import AsyncMock

from app import app
from api.v1.user.dependencies import get_current_user_optional, change_password_user_use_case
from domain.user.crypto import context
from domain.user.exceptions import UserNotFound, UserIsExist, WrongPasswordError
from infrastructure.databases.postgresql.models.user import User


@pytest.mark.asyncio
async def test_change_password_forbidden_when_no_user(client):
    app.dependency_overrides.pop(get_current_user_optional, None)

    response = await client.put(
        "/api/v1/user/change-password",
        json={
            "current_password": "OldPassword1",
            "new_password": "NewPassword1",
        },
    )

    assert response.status_code == 403
    assert "do not have permission" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_change_password_returns_404(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="user404",
        email="user404@example.com",
        password=context.hash("OldPassword1"),
    )
    session.add(user)
    await session.flush()
    await session.commit()

    fake_usecase = AsyncMock()
    fake_usecase.execute.side_effect = UserNotFound()

    app.dependency_overrides[change_password_user_use_case] = lambda: fake_usecase
    app.dependency_overrides[get_current_user_optional] = lambda: user

    response = await client.put(
        "/api/v1/user/change-password",
        json={
            "current_password": "OldPassword1",
            "new_password": "NewPassword1",
        },
    )

    assert response.status_code == 404
    assert "user not found" in response.json()["detail"].lower()

    app.dependency_overrides.pop(change_password_user_use_case, None)
    app.dependency_overrides.pop(get_current_user_optional, None)


@pytest.mark.asyncio
async def test_change_password_returns_409(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="user409",
        email="user409@example.com",
        password=context.hash("OldPassword1"),
    )
    session.add(user)
    await session.flush()
    await session.commit()

    fake_usecase = AsyncMock()
    fake_usecase.execute.side_effect = UserIsExist(field="email", value="test@example.com")

    app.dependency_overrides[change_password_user_use_case] = lambda: fake_usecase
    app.dependency_overrides[get_current_user_optional] = lambda: user

    response = await client.put(
        "/api/v1/user/change-password",
        json={
            "current_password": "OldPassword1",
            "new_password": "NewPassword1",
        },
    )

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()

    app.dependency_overrides.pop(change_password_user_use_case, None)
    app.dependency_overrides.pop(get_current_user_optional, None)


@pytest.mark.asyncio
async def test_change_password_returns_400(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="user400",
        email="user400@example.com",
        password=context.hash("OldPassword1"),
    )
    session.add(user)
    await session.flush()
    await session.commit()

    fake_usecase = AsyncMock()
    fake_usecase.execute.side_effect = ValueError("invalid password format")

    app.dependency_overrides[change_password_user_use_case] = lambda: fake_usecase
    app.dependency_overrides[get_current_user_optional] = lambda: user

    response = await client.put(
        "/api/v1/user/change-password",
        json={
            "current_password": "OldPassword1",
            "new_password": "NewPassword1",
        },
    )

    assert response.status_code == 400
    assert "invalid password format" in response.json()["detail"].lower()

    app.dependency_overrides.pop(change_password_user_use_case, None)
    app.dependency_overrides.pop(get_current_user_optional, None)


@pytest.mark.asyncio
async def test_change_password_returns_401(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="user401",
        email="user401@example.com",
        password=context.hash("OldPassword1"),
    )
    session.add(user)
    await session.flush()
    await session.commit()

    fake_usecase = AsyncMock()
    fake_usecase.execute.side_effect = WrongPasswordError()

    app.dependency_overrides[change_password_user_use_case] = lambda: fake_usecase
    app.dependency_overrides[get_current_user_optional] = lambda: user

    response = await client.put(
        "/api/v1/user/change-password",
        json={
            "current_password": "OldPassword1",
            "new_password": "NewPassword1",
        },
    )

    assert response.status_code == 401
    assert "wrong password" in response.json()["detail"].lower()

    app.dependency_overrides.pop(change_password_user_use_case, None)
    app.dependency_overrides.pop(get_current_user_optional, None)