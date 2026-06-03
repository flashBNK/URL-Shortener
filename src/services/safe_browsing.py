import httpx

from logger import get_logger

log = get_logger("services.safe_browsing")


class SafeBrowsingService:

    def __init__(self, api_key: str):
        self._api_key = api_key
        self._base_url = "https://safebrowsing.googleapis.com/v4"


    async def is_url_safe(self, url: str) -> bool:
        payload = {
            "client": {
                "clientId": "url-shortener",
                "clientVersion": "1.0.0",
            },
            "threatInfo": {
                "threatTypes": [
                    "MALWARE",
                    "SOCIAL_ENGINEERING",
                    "UNWANTED_SOFTWARE",
                    "POTENTIALLY_HARMFUL_APPLICATION",
                ],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}],
            },
        }

        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.post(
                    f"{self._base_url}/threatMatches:find",
                    params={"key": self._api_key},
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                return "matches" not in data
        except httpx.HTTPStatusError:
            log.warning("safe browsing api error", url=url)
            return True
        except httpx.RequestError:
            log.warning("safe browsing api unavailable", url=url)
            return True