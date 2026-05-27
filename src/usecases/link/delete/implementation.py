from infrastructure.redis.link_cache import LinkCache
from .abstract import AbstractDeleteLinkUseCase


class PostgreSQLDeleteLinkUseCase(AbstractDeleteLinkUseCase):
    def __init__(self, uow, cache: LinkCache):
        self._uow = uow
        self._cache = cache


    async def execute(self, user_id: int, short_url: str):
        await self._cache.delete(short_url)

        async with self._uow as uow:
            await uow.repository.delete_by_user(user_id=user_id, short_url=short_url)
        await self._cache.delete(short_url)