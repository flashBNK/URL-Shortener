from typing import List

from domain.link.models import LinkDTO
from domain.pagination.paginate import PaginationDTO

from .abstract import AbstractListPublicLinksUseCase


class PostgreSQLListPublicLinksUseCase(AbstractListPublicLinksUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, paginate: PaginationDTO) -> tuple[List[LinkDTO], int]:
        async with self._uow as uow:
            links, total = await uow.repository.list_public_links(paginate)

        return links, total