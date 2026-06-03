import pytest
from datetime import datetime, timezone

from app import app
from api.v1.user.dependencies import get_current_user_optional
from domain.user.crypto import context
from infrastructure.databases.postgresql.models.link import Link
from infrastructure.databases.postgresql.models.user import User
from infrastructure.databases.postgresql.models.link_click import LinkClick


@pytest.mark.asyncio
async def test_list_clicks_success(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="clickuser",
        email="clickuser@example.com",
        password=context.hash("Password123"),
    )
    session.add(user)
    await session.flush()

    link = Link(
        short_url="click123",
        url="https://example.com",
        total=2,
        is_active=True,
        expires_at=None,
        user_id=user.id,
    )
    session.add(link)
    await session.flush()

    click1 = LinkClick(
        ip="127.0.0.1",
        country="Russia",
        user_agent="pytest-agent-1",
        clicked_at=datetime.now(timezone.utc),
        link_id=link.id,
    )
    click2 = LinkClick(
        ip="127.0.0.2",
        country="Germany",
        user_agent="pytest-agent-2",
        clicked_at=datetime.now(timezone.utc),
        link_id=link.id,
    )

    session.add_all([click1, click2])


    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "clickuser",
            "password": "Password123",
        },
    )
    assert login_response.status_code == 201

    access_token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/link/click123/clicks",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2

    countries = {item["country"] for item in data["items"]}
    assert countries == {"Russia", "Germany"}

    user_agents = {item["user_agent"] for item in data["items"]}
    assert user_agents == {"pytest-agent-1", "pytest-agent-2"}


@pytest.mark.asyncio
async def test_list_clicks_unauthorized(client):
    response = await client.get("/api/v1/link/click123/clicks")

    assert response.status_code == 401
    assert response.json()["detail"] == "You must be signed in to access"


@pytest.mark.asyncio
async def test_list_clicks_link_not_found(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="nofoundclick",
        email="nofoundclick@example.com",
        password=context.hash("Password123"),
    )
    session.add(user)


    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "nofoundclick",
            "password": "Password123",
        },
    )
    assert login_response.status_code == 201

    access_token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/link/unknown123/clicks",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Link not found"


@pytest.mark.asyncio
async def test_stats_link_success(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="statsuser",
        email="statsuser@example.com",
        password=context.hash("Password123"),
    )
    session.add(user)
    await session.flush()

    link = Link(
        short_url="stats123",
        url="https://example.com",
        total=3,
        is_active=True,
        expires_at=None,
        user_id=user.id,
    )
    session.add(link)
    await session.flush()

    clicks = [
        LinkClick(
            ip="127.0.0.1",
            country="Russia",
            user_agent="pytest-agent",
            clicked_at=datetime.now(timezone.utc),
            link_id=link.id,
        ),
        LinkClick(
            ip="127.0.0.2",
            country="Russia",
            user_agent="pytest-agent",
            clicked_at=datetime.now(timezone.utc),
            link_id=link.id,
        ),
        LinkClick(
            ip="127.0.0.3",
            country="Germany",
            user_agent="pytest-agent",
            clicked_at=datetime.now(timezone.utc),
            link_id=link.id,
        ),
    ]
    session.add_all(clicks)

    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "statsuser",
            "password": "Password123",
        },
    )
    assert login_response.status_code == 201

    access_token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/link/stats123/stats",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["link_id"] == link.id
    assert data["total"] == 3
    assert "by_country" in data
    assert "clicks_by_device" in data
    assert "clicks_by_date" in data


@pytest.mark.asyncio
async def test_stats_link_unauthorized(client):
    response = await client.get("/api/v1/link/stats123/stats")

    assert response.status_code == 401
    assert response.json()["detail"] == "You must be signed in to access"