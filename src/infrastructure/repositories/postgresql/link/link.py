import re
from typing import List
from datetime import datetime, UTC, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import  select, update
from sqlalchemy.exc import IntegrityError

from domain.link.exceptions import LinkNotFoundError, LinkIsExist, LinkIsExpires
from domain.link.repository import AbstractLinkRepository
from domain.link.models import LinkDTO, CreateLinkDTO, UpdateLinkDTO
from infrastructure.databases.postgresql.models.link import Link as LinkModel


class PostgreSQLLinkRepository(AbstractLinkRepository):
    def __init__(self, session: AsyncSession):
        self._session = session


    async def redirect(self, short_url: str) -> LinkDTO:
        result = await self._session.execute(
            select(LinkModel)
            .where(LinkModel.short_url == short_url)
        )
        link = result.scalar_one_or_none()

        if link is None:
            raise LinkNotFoundError()
        if link.expires_at is None:
            pass
        elif link.expires_at < datetime.now(UTC):
            raise LinkIsExpires()

        await self._session.execute(
            update(LinkModel)
            .where(LinkModel.short_url == short_url)
            .values(total=link.total + 1)
        )

        return self._to_domain(link)



    async def find_by_short_url(self, short_url: str) -> LinkDTO:
        result = await self._session.execute(
            select(LinkModel).where(LinkModel.short_url == short_url)
        )
        link = result.scalar_one_or_none()

        if link is None:
            raise LinkNotFoundError()

        return self._to_domain(link)


    async def create(self, dto: CreateLinkDTO) -> LinkDTO:
        if dto.user_id:
            expires_at = None
        else:
            expires_at = datetime.now(UTC) + timedelta(days=5)

        db_link = LinkModel(
            url=dto.url,
            short_url=dto.short_url,
            total=0,
            expires_at=expires_at,
            user_id=dto.user_id,
        )

        self._session.add(db_link)
        try:
            await self._session.flush()
        except IntegrityError as e:
            pattern = r'Key \((.*?)\)=\((.*?)\)'
            match = re.search(pattern, str(e))
            columns = [col.strip() for col in match.group(1).split(',')]
            values = [val.strip() for val in match.group(2).split(',')]

            raise LinkIsExist(field=columns[0], value=values[0])

        return self._to_domain(db_link)


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
            total=link.total,
            is_active=link.is_active,
            expires_at=link.expires_at,
            user_id=link.user_id,
        )