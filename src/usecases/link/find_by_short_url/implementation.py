from domain.link.models import LinkDTO

from .abstract import AbstractFindByShortUrlLinkUseCase


class PostgreSQLFindByShortUrlLinkUseCase(AbstractFindByShortUrlLinkUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, short_url: str) -> LinkDTO:

        async with self._uow as uow:
            link = await uow.repository.find_by_short_url(short_url)

        return link