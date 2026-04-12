from sqlalchemy.ext.asyncio import AsyncSession

from container import Container
from infrastructure.repositories.postgresql.link.uow import PostgreSQLLinkUnitOfWork

def build_link_unit_of_work(
    session: AsyncSession,
) -> PostgreSQLLinkUnitOfWork:
    return Container.link_uow_factory(session=session)
