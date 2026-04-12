from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.databases.postgresql.session import get_async_session
from infrastructure.di.injection import build_link_unit_of_work
from infrastructure.repositories.postgresql.link.uow import PostgreSQLLinkUnitOfWork

from usecases.link.get.implementation import PostgreSQLGetLinkUseCase

def get_link_unit_of_work(
    session: AsyncSession = Depends(get_async_session)
) -> PostgreSQLLinkUnitOfWork:
    return build_link_unit_of_work(session)


def get_link_use_case(
    session: AsyncSession = Depends(get_async_session),
):
    uow = get_link_unit_of_work(session=session)
    return PostgreSQLGetLinkUseCase(uow=uow)