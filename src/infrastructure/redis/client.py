import redis.asyncio as aioredis
from redis.asyncio import Redis


class RedisClient:
    def __init__(self):
        self._client: Redis | None = None

    def init(self, url: str) -> None:
        self._client = aioredis.from_url(url, decode_responses=True)

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    @property
    def client(self) -> Redis:
        if not self._client:
            raise RuntimeError("Redis client is not initialized")
        return self._client


redis_client = RedisClient()