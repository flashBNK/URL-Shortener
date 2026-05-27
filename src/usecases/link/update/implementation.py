from domain.link.models import LinkDTO, UpdateLinkDTO
from infrastructure.redis.link_cache import LinkCache
from .abstract import AbstractUpdateLinkUseCase


class PostgreSQLUpdateLinkUseCase(AbstractUpdateLinkUseCase):
    def __init__(self, uow, cache: LinkCache):
        self._uow = uow
        self._cache = cache

    async def execute(self, user_id: int, short_url: str, dto: UpdateLinkDTO) -> LinkDTO:

        async with self._uow as uow:
            link = await uow.repository.update_by_short_url(user_id=user_id, short_url=short_url, dto=dto)
        await self._cache.delete(short_url)

        return link