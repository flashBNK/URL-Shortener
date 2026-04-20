import httpx

from urllib.parse import urlparse

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


    async def check_url_active(self, url: str):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.head(url, timeout=3)
                return response.status_code < 400
        except httpx.RequestError:
            return False