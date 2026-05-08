import httpx

from urllib.parse import urlparse


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
                        return True
                except httpx.RequestError as e:
                    print("HEAD failed:", e)

                try:
                    async with client.stream("GET", url, headers=_HEADERS) as response:
                        return response.status_code < 500
                except httpx.RequestError as e:
                    print("GET failed:", e)

                return False

        except httpx.RequestError as e:
            print("HEAD ERROR:", repr(e))
            return False