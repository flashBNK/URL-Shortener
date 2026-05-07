from typing import List

from domain.link.models import LinkDTO

from .abstract import AbstractGetMeLinksUseCase


class PostgreSQLGetMeLinksUseCase(AbstractGetMeLinksUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, user_id: int) -> List[LinkDTO]:

        async with self._uow as uow:
            links = await uow.repository.list_me(user_id)

        return links