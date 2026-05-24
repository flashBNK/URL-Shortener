from infrastructure.redis import client as redis_module


class LinkCache:
    def __init__(self):  # ← никаких аргументов
        self._ttl = 3600

    def _key(self, short_url: str) -> str:
        return f"link:{short_url}"

    async def get(self, short_url: str) -> str | None:
        return await redis_module.redis_client.client.get(self._key(short_url))

    async def set(self, short_url: str, original_url: str) -> None:
        await redis_module.redis_client.client.set(self._key(short_url), original_url, ex=self._ttl)

    async def delete(self, short_url: str) -> None:
        await redis_module.redis_client.client.delete(self._key(short_url))