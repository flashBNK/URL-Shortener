import pytest
import httpx

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


@pytest.mark.asyncio
async def test_safe_browsing_returns_true_when_api_fails():
    """Если Google Safe Browsing API недоступен — считаем URL безопасным.
    Это fail-open поведение: не блокировать пользователей из-за проблем на стороне Google.
    """
    service = SafeBrowsingService("api_key")

    request = httpx.Request("POST", "https://safebrowsing.googleapis.com")
    network_error = httpx.RequestError("Connection refused", request=request)

    with patch(
        "services.safe_browsing.httpx.AsyncClient.post",
        new=AsyncMock(side_effect=network_error),
    ):
        result = await service.is_url_safe("https://example.com")

    assert result is True