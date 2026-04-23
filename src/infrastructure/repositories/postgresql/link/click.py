from datetime import datetime, UTC

from sqlalchemy.ext.asyncio import AsyncSession

from domain.link.models import CreateLinkClickDTO, LinkClickDTO
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