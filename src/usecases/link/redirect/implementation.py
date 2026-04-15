from domain.link.models import LinkDTO

from .abstract import AbstractRedirectLinkUseCase


class PostgreSQLRedirectLinkUseCase(AbstractRedirectLinkUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, short_url: str) -> LinkDTO:

        async with self._uow as uow:
            link = await uow.repository.redirect(short_url)

        return link