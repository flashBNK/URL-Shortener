import pytest
from unittest.mock import AsyncMock, patch

from app import app
from api.v1.user.dependencies import get_current_user_optional
from domain.user.crypto import context
from infrastructure.databases.postgresql.models import User


def _mock_link_services(is_valid_url=True, is_url_active=True, is_url_safe=True):
    return (
        patch(
            "services.url.UrlService.is_valid_url",
            return_value=is_valid_url,
        ),
        patch(
            "services.url.UrlService.check_url_active",
            new=AsyncMock(return_value=is_url_active),
        ),
        patch(
            "services.safe_browsing.SafeBrowsingService.is_url_safe",
            new=AsyncMock(return_value=is_url_safe),
        ),
    )


@pytest.mark.asyncio
async def test_create_link_anonymous(client):
    with (
        patch("services.url.UrlService.is_valid_url", return_value=True),
        patch(
            "services.url.UrlService.check_url_active",
            new=AsyncMock(return_value=True),
        ),
        patch(
            "services.safe_browsing.SafeBrowsingService.is_url_safe",
            new=AsyncMock(return_value=True),
        ),
    ):
        response = await client.post(
            "/api/v1/link/",
            json={
                "url": "https://example.com",
            },
        )

    assert response.status_code == 201

    data = response.json()
    assert data["url"] == "https://example.com"
    assert data["user_id"] is None
    assert data["expires_at"] is not None
    assert "short_url" in data


@pytest.mark.asyncio
async def test_create_link_authenticated_has_no_expiry(client, session):
    app.dependency_overrides.pop(get_current_user_optional, None)

    user = User(
        username="linkowner",
        email="linkowner@example.com",
        password=context.hash("Password123"),
    )
    session.add(user)
    await session.commit()

    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "username": "linkowner",
            "password": "Password123",
        },
    )
    assert login_response.status_code == 201

    access_token = login_response.json()["access_token"]

    with (
        patch("services.url.UrlService.is_valid_url", return_value=True),
        patch(
            "services.url.UrlService.check_url_active",
            new=AsyncMock(return_value=True),
        ),
        patch(
            "services.safe_browsing.SafeBrowsingService.is_url_safe",
            new=AsyncMock(return_value=True),
        ),
    ):
        response = await client.post(
            "/api/v1/link/",
            json={
                "url": "https://example.com/owner",
            },
            headers={
                "Authorization": f"Bearer {access_token}",
            },
        )

    assert response.status_code == 201

    data = response.json()
    assert data["url"] == "https://example.com/owner"
    assert data["user_id"] == user.id
    assert data["expires_at"] is None


@pytest.mark.asyncio
async def test_create_link_custom_alias(client):
    with (
        patch("services.url.UrlService.is_valid_url", return_value=True),
        patch(
            "services.url.UrlService.check_url_active",
            new=AsyncMock(return_value=True),
        ),
        patch(
            "services.safe_browsing.SafeBrowsingService.is_url_safe",
            new=AsyncMock(return_value=True),
        ),
    ):
        response = await client.post(
            "/api/v1/link/",
            json={
                "url": "https://example.com/custom",
                "custom_alias": "alias001",
            },
        )

    assert response.status_code == 201

    data = response.json()
    assert data["short_url"] == "alias001"
    assert data["url"] == "https://example.com/custom"


@pytest.mark.asyncio
async def test_create_link_duplicate_alias(client):
    with (
        patch("services.url.UrlService.is_valid_url", return_value=True),
        patch(
            "services.url.UrlService.check_url_active",
            new=AsyncMock(return_value=True),
        ),
        patch(
            "services.safe_browsing.SafeBrowsingService.is_url_safe",
            new=AsyncMock(return_value=True),
        ),
    ):
        first = await client.post(
            "/api/v1/link/",
            json={
                "url": "https://example.com/one",
                "custom_alias": "aliasdup",
            },
        )
        assert first.status_code == 201

        second = await client.post(
            "/api/v1/link/",
            json={
                "url": "https://example.com/two",
                "custom_alias": "aliasdup",
            },
        )

    assert second.status_code == 409


@pytest.mark.asyncio
async def test_create_link_invalid_url(client):
    with (
        patch("services.url.UrlService.is_valid_url", return_value=False),
        patch(
            "services.url.UrlService.check_url_active",
            new=AsyncMock(return_value=True),
        ),
        patch(
            "services.safe_browsing.SafeBrowsingService.is_url_safe",
            new=AsyncMock(return_value=True),
        ),
    ):
        response = await client.post(
            "/api/v1/link/",
            json={
                "url": "not-a-url",
            },
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_link_inactive_url(client):
    with (
        patch("services.url.UrlService.is_valid_url", return_value=True),
        patch(
            "services.url.UrlService.check_url_active",
            new=AsyncMock(return_value=False),
        ),
        patch(
            "services.safe_browsing.SafeBrowsingService.is_url_safe",
            new=AsyncMock(return_value=True),
        ),
    ):
        response = await client.post(
            "/api/v1/link/",
            json={
                "url": "https://example.com/inactive",
            },
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_link_unsafe_url(client):
    with (
        patch("services.url.UrlService.is_valid_url", return_value=True),
        patch(
            "services.url.UrlService.check_url_active",
            new=AsyncMock(return_value=True),
        ),
        patch(
            "services.safe_browsing.SafeBrowsingService.is_url_safe",
            new=AsyncMock(return_value=False),
        ),
    ):
        response = await client.post(
            "/api/v1/link/",
            json={
                "url": "https://malware-example.com",
            },
        )

    assert response.status_code == 422