import httpx


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
            return False