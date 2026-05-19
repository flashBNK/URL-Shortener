from typing import List

from domain.link.models import LinkClickDTO
from domain.pydantic.paginate import PaginationDTO

from .abstract import AbstractGetLinkClicksUseCase


class PostgreSQLGetLinkClicksUseCase(AbstractGetLinkClicksUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, short_url: str, user_id: int, paginate: PaginationDTO | None) -> tuple[List[LinkClickDTO], int]:
        async with self._uow as uow:
            link = await uow.repository.find_by_short_url_and_check(short_url, user_id)
            click_links, total = await uow.click_repository.list_by_short_url(link.id, paginate)

        return click_links, total