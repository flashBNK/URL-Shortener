import json

from domain.link.models import LinkDTO
from infrastructure.redis import client as redis_module


class LinkCache:
    def __init__(self):
        self._ttl = 600

    def _key(self, short_url: str) -> str:
        return f"link:{short_url}"

    async def get(self, short_url: str) -> dict | None:
        data = await redis_module.redis_client.client.get(self._key(short_url))
        return json.loads(data) if data else None

    async def set(self, short_url: str, link: LinkDTO) -> None:
        data = json.dumps({
            "url": link.url,
            "id": link.id,
            "is_active": link.is_active,
            "short_url": short_url,
            "total": link.total,
            "user_id": link.user_id,
            "expires_at": link.expires_at
        })
        await redis_module.redis_client.client.set(self._key(short_url), data, ex=self._ttl)

    async def delete(self, short_url: str) -> None:
        await redis_module.redis_client.client.delete(self._key(short_url))