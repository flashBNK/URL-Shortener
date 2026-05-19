from typing import List

from domain.link.models import LinkDTO
from domain.pydantic.paginate import PaginationDTO

from .abstract import AbstractGetMeLinksUseCase


class PostgreSQLGetMeLinksUseCase(AbstractGetMeLinksUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, user_id: int, paginate: PaginationDTO | None) -> tuple[List[LinkDTO], int]:

        async with self._uow as uow:
            links, total = await uow.repository.list_me(user_id, paginate)

        return links, total