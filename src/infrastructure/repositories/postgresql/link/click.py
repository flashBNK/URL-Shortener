from datetime import UTC, datetime
from typing import List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.link.models import CreateLinkClickDTO, LinkClickDTO
from domain.pagination.paginate import PaginationDTO
from infrastructure.databases.postgresql.models.link_click import LinkClick as LinkClickModel


class PostgreSQLLinkClickRepository:
    def __init__(self, session: AsyncSession):
        self._session = session


    async def create(self, dto: CreateLinkClickDTO) -> LinkClickDTO:

        clicked_at = datetime.now(UTC)

        db_link_click = LinkClickModel(
            ip=dto.ip,
            country=dto.country,
            user_agent=dto.user_agent,
            link_id=dto.link_id,
            clicked_at=clicked_at,
        )

        self._session.add(db_link_click)
        await self._session.flush()

        return self._to_domain(db_link_click)


    async def get_by_link_id(self, link_id: int) -> List[LinkClickDTO]:
        stmt = (
            select(LinkClickModel)
            .where(LinkClickModel.link_id == link_id)
        )

        result = await self._session.execute(stmt)
        link_cliks = result.scalars().all()

        return [self._to_domain(link_clik) for link_clik in link_cliks]


    async def list_by_short_url(self, link_id: int, paginate: PaginationDTO | None) -> tuple[List[LinkClickDTO], int]:
        count_stmt = select(func.count()).where(LinkClickModel.link_id == link_id)
        total = (await self._session.execute(count_stmt)).scalar()

        if not total or not paginate:
            return [], 0

        stmt = (
            (select(LinkClickModel)
            .where(LinkClickModel.link_id == link_id))
            .offset(paginate.offset)
            .limit(paginate.limit)
            .order_by(LinkClickModel.id.desc())
        )
        result = await self._session.execute(stmt)
        clicks = result.scalars().all()

        return [self._to_domain(click) for click in clicks], total


    @staticmethod
    def _to_domain(link_click: LinkClickModel) -> LinkClickDTO:
        return LinkClickDTO(
            id=link_click.id,
            ip=link_click.ip,
            country=link_click.country,
            user_agent=link_click.user_agent,
            link_id=link_click.link_id,
            clicked_at=link_click.clicked_at,
        )