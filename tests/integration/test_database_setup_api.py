import pytest

from infrastructure.databases.postgresql.models.user import User


@pytest.mark.asyncio
async def test_can_insert_user(session):
    user = User(
        username="testuser",
        email="test@example.com",
        password="hashed-password",
    )

    session.add(user)

    await session.flush()

    assert user.id is not None