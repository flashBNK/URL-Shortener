import httpx
import pytest

from unittest.mock import Mock, AsyncMock, patch
from services.url import UrlService


def test_normalize_url_adds_https_if_missing():
    service = UrlService()

    assert service.normalize_url("example.com") == "https://example.com"


def test_normalize_url_strips_spaces():
    service = UrlService()

    assert service.normalize_url("  example.com  ") == "https://example.com"


def test_normalize_url_keeps_existing_scheme():
    service = UrlService()

    assert service.normalize_url("http://example.com") == "http://example.com"


def test_is_valid_url_returns_true_for_valid_url():
    service = UrlService()

    assert service.is_valid_url("https://example.com") is True


def test_is_valid_url_returns_false_for_invalid_url():
    service = UrlService()

    assert service.is_valid_url("not-a-url") is False


@pytest.mark.asyncio
async def test_check_url_active_returns_true_when_head_is_ok():
    service = UrlService()

    mock_response = Mock()
    mock_response.status_code = 200

    mock_client = AsyncMock()
    mock_client.head = AsyncMock(return_value=mock_response)

    mock_context_manager = AsyncMock()
    mock_context_manager.__aenter__.return_value = mock_client
    mock_context_manager.__aexit__.return_value = None

    with patch("services.url.httpx.AsyncClient", return_value=mock_context_manager):
        result = await service.check_url_active("https://example.com")

    assert result is True
    mock_client.head.assert_awaited_once()


@pytest.mark.asyncio
async def test_check_url_active_falls_back_to_get_when_head_fails():
    service = UrlService()

    head_error = httpx.RequestError("HEAD failed", request=httpx.Request("HEAD", "https://example.com"))

    head_mock = AsyncMock(side_effect=head_error)

    get_response = Mock()
    get_response.status_code = 200

    stream_cm = AsyncMock()
    stream_cm.__aenter__.return_value = get_response
    stream_cm.__aexit__.return_value = None

    mock_client = AsyncMock()
    mock_client.head = head_mock
    mock_client.stream = Mock(return_value=stream_cm)

    mock_context_manager = AsyncMock()
    mock_context_manager.__aenter__.return_value = mock_client
    mock_context_manager.__aexit__.return_value = None

    with patch("services.url.httpx.AsyncClient", return_value=mock_context_manager):
        result = await service.check_url_active("https://example.com")

    assert result is True
    mock_client.head.assert_awaited_once()
    mock_client.stream.assert_called_once()


@pytest.mark.asyncio
async def test_check_url_active_returns_false_when_all_requests_fail():
    service = UrlService()

    head_error = httpx.RequestError("HEAD failed", request=httpx.Request("HEAD", "https://example.com"))
    get_error = httpx.RequestError("GET failed", request=httpx.Request("GET", "https://example.com"))

    mock_client = AsyncMock()
    mock_client.head = AsyncMock(side_effect=head_error)
    mock_client.stream = Mock(side_effect=get_error)

    mock_context_manager = AsyncMock()
    mock_context_manager.__aenter__.return_value = mock_client
    mock_context_manager.__aexit__.return_value = None

    with patch("services.url.httpx.AsyncClient", return_value=mock_context_manager):
        result = await service.check_url_active("https://example.com")

    assert result is False


@pytest.mark.asyncio
async def test_check_url_active_falls_back_to_get_when_head_returns_405():
    service = UrlService()

    head_response = Mock()
    head_response.status_code = 405

    get_response = Mock()
    get_response.status_code = 200

    stream_cm = AsyncMock()
    stream_cm.__aenter__.return_value = get_response
    stream_cm.__aexit__.return_value = None

    mock_client = AsyncMock()
    mock_client.head = AsyncMock(return_value=head_response)
    mock_client.stream = Mock(return_value=stream_cm)

    mock_context_manager = AsyncMock()
    mock_context_manager.__aenter__.return_value = mock_client
    mock_context_manager.__aexit__.return_value = None

    with patch("services.url.httpx.AsyncClient", return_value=mock_context_manager):
        result = await service.check_url_active("https://example.com")

    assert result is True
    mock_client.head.assert_awaited_once()
    mock_client.stream.assert_called_once()


@pytest.mark.asyncio
async def test_check_url_active_returns_false_when_server_returns_500():
    service = UrlService()

    head_response = Mock()
    head_response.status_code = 500

    mock_client = AsyncMock()
    mock_client.head = AsyncMock(return_value=head_response)

    mock_context_manager = AsyncMock()
    mock_context_manager.__aenter__.return_value = mock_client
    mock_context_manager.__aexit__.return_value = None

    with patch("services.url.httpx.AsyncClient", return_value=mock_context_manager):
        result = await service.check_url_active("https://example.com")

    assert result is False