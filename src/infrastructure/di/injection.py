from sqlalchemy.ext.asyncio import AsyncSession

from container import Container
from infrastructure.repositories.postgresql.link.uow import PostgreSQLLinkUnitOfWork
from infrastructure.repositories.postgresql.user.uow import PostgreSQLUserUnitOfWork
from infrastructure.repositories.postgresql.token.uow import PostgreSQLTokenUnitOfWork

def build_link_unit_of_work(
    session: AsyncSession,
) -> PostgreSQLLinkUnitOfWork:
    return Container.link_uow_factory(session=session)


def build_user_unit_of_work(
    session: AsyncSession,
) -> PostgreSQLUserUnitOfWork:
    return Container.user_uow_factory(session=session)


def build_token_unit_of_work(
    session: AsyncSession,
) -> PostgreSQLTokenUnitOfWork:
    return Container.token_uow_factory(session=session)