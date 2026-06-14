import json
from datetime import datetime

from redis.exceptions import RedisError

from domain.link.models import LinkDTO
from infrastructure.redis import client as redis_module
from logger import get_logger

log = get_logger("infrastructure.redis.link_cache")


class LinkCache:
    def __init__(self):
        self._ttl = 600

    def _key(self, short_url: str) -> str:
        return f"link:{short_url}"

    async def get(self, short_url: str) -> dict | None:
        try:
            data = await redis_module.redis_client.client.get(self._key(short_url))
        except (RedisError, OSError) as exc:
            log.warning("redis cache get failed", short_url=short_url, error=str(exc))
            return None

        if not data:
            return None

        try:
            parsed = json.loads(data)

            if parsed.get("expires_at"):
                parsed["expires_at"] = datetime.fromisoformat(parsed["expires_at"])
        except (json.JSONDecodeError, TypeError, ValueError) as exc:
            log.warning("redis cache payload invalid", short_url=short_url, error=str(exc))
            return None

        return parsed

    async def set(self, short_url: str, link: LinkDTO) -> None:
        data = json.dumps({
            "url": link.url,
            "id": link.id,
            "is_active": link.is_active,
            "short_url": short_url,
            "total": link.total,
            "user_id": link.user_id,
            "expires_at": link.expires_at.isoformat() if link.expires_at else None
        })
        try:
            await redis_module.redis_client.client.set(self._key(short_url), data, ex=self._ttl)
        except (RedisError, OSError) as exc:
            log.warning("redis cache set failed", short_url=short_url, error=str(exc))

    async def delete(self, short_url: str) -> None:
        try:
            await redis_module.redis_client.client.delete(self._key(short_url))
        except (RedisError, OSError) as exc:
            log.warning("redis cache delete failed", short_url=short_url, error=str(exc))
