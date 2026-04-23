import httpx

from domain.link.exceptions import GetGeoError


class GeoService:
    def __init__(self):
        self._base_url = "http://ip-api.com/json"

    async def get_country(self, ip: str) -> str | None:
        try:
            async with httpx.AsyncClient(timeout=3) as client:
                response = await client.get(f"{self._base_url}/{ip}?fields=country")
                data = response.json()
                return data["country"]
        except Exception:
            return None