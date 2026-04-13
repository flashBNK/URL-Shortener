from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, select

from domain.link.exceptions import LinkNotFoundError
from domain.link.repository import AbstractLinkRepository
from domain.link.models import LinkDTO, CreateLinkDTO, UpdateLinkDTO, ListLinksDTO
from infrastructure.databases.postgresql.models.link import Link as LinkModel


class PostgreSQLLinkRepository(AbstractLinkRepository):
    def __init__(self, session: AsyncSession):
        self._session = session


    async def find_by_short_url(self, short_url: str) -> LinkDTO:
        result = await self._session.execute(
            select(LinkModel).where(LinkModel.short_url == short_url)
        )
        link = result.scalar_one_or_none()

        if link is None:
            raise LinkNotFoundError()

        return self._to_domain(link)


    async def create(self, dto: CreateLinkDTO) -> LinkDTO:
        pass

    async def get(self, link_id: int) -> LinkDTO:
        pass

    async def update(self, link_id: int, dto: UpdateLinkDTO) -> LinkDTO:
        pass

    async def delete(self, link_id: int) -> None:
        pass

    async def list(self, limit: int = 100, offset: int = 0) -> List[LinkDTO]:
        pass


    @staticmethod
    def _to_domain(link: LinkModel) -> LinkDTO:
        return LinkDTO(
            id=link.id,
            short_url=link.short_url,
            url=link.url,
        )