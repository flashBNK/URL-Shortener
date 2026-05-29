import pytest

from unittest.mock import AsyncMock, Mock, patch

from services.safe_browsing import SafeBrowsingService


@pytest.mark.asyncio
async def test_safe_url_returns_true():
    service = SafeBrowsingService("api_key")

    mock_response = Mock()
    mock_response.json.return_value = {}
    mock_response.raise_for_status.return_value = None

    with patch(
        "services.safe_browsing.httpx.AsyncClient.post",
        new=AsyncMock(return_value=mock_response),
    ):
        result = await service.is_url_safe("https://example.com")

    assert result is True


@pytest.mark.asyncio
async def test_dangerous_url_returns_false():
    service = SafeBrowsingService("api_key")

    mock_response = Mock()

    mock_response.json.return_value = {
        "matches": [
            {
                "threatType": "MALWARE",
            }
        ]
    }

    mock_response.raise_for_status.return_value = None

    with patch(
        "services.safe_browsing.httpx.AsyncClient.post",
        new=AsyncMock(return_value=mock_response),
    ):
        result = await service.is_url_safe("https://malware.com")

    assert result is False


@pytest.mark.asyncio
async def test_safe_browsing_calls_external_api():
    service = SafeBrowsingService("api_key")

    mock_response = Mock()
    mock_response.json.return_value = {}
    mock_response.raise_for_status.return_value = None

    with patch(
        "services.safe_browsing.httpx.AsyncClient.post",
        new=AsyncMock(return_value=mock_response),
    ) as mocked_post:

        await service.is_url_safe("https://example.com")

    mocked_post.assert_called_once()