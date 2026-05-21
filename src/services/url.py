import httpx

from urllib.parse import urlparse
from logger import get_logger

log = get_logger("services.url")


_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}


class UrlService:

    def normalize_url(self, url: str) -> str:
        url = url.strip()
        parsed = urlparse(url)
        if not parsed.scheme:
            url = "https://" + url
        return url


    def is_valid_url(self, url: str) -> bool:
        parsed = urlparse(url)
        return bool(parsed.netloc)


    async def check_url_active(self, url: str) -> bool:
        """НАДО ДОПИЛИТЬ ПРОВЕРКУ СЕРТИФИКАТОВ В ПРОЕКТЕ"""
        log.debug("checking url availability", url=url)
        try:
            async with httpx.AsyncClient(
                timeout=10,
                follow_redirects=True,
                verify=False,
            ) as client:
                # Пробуем HEAD — быстро и без тела ответа
                try:
                    response = await client.head(url, headers=_HEADERS)
                    if response.status_code < 500:
                        result = response.status_code < 500
                        log.debug("url check complete", url=url, method="HEAD",
                                  status_code=response.status_code, is_active=result)
                        return result
                except httpx.RequestError as e:
                    pass

                try:
                    async with client.stream("GET", url, headers=_HEADERS) as response:
                        result = response.status_code < 500
                        log.debug("url check complete", url=url, method="GET",
                                  status_code=response.status_code, is_active=result)
                        return result
                except httpx.RequestError as e:
                    log.warning("url check failed", url=url, error=str(e))

                return False

        except httpx.RequestError as e:
            log.warning("url check failed", url=url, error=str(e))
            return False