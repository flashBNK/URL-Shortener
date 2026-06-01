import pytest

from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_create_link_success(client):

    with (
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
                "url": "https://example.com"
            }
        )

    assert response.status_code == 201

    data = response.json()

    assert data["url"] == "https://example.com"

    assert "short_url" in data