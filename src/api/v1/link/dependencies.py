from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.databases.postgresql.session import get_async_session
from infrastructure.di.injection import build_link_unit_of_work
from infrastructure.repositories.postgresql.link.uow import PostgreSQLLinkUnitOfWork

from usecases.link.find_by_short_url.implementation import PostgreSQLFindByShortUrlLinkUseCase
from usecases.link.create.implementation import PostgreSQLCreateLinkUseCase

def get_link_unit_of_work(
    session: AsyncSession = Depends(get_async_session)
) -> PostgreSQLLinkUnitOfWork:
    return build_link_unit_of_work(session)


def find_by_short_url_link_use_case(
    session: AsyncSession = Depends(get_async_session),
):
    uow = get_link_unit_of_work(session=session)
    return PostgreSQLFindByShortUrlLinkUseCase(uow=uow)


def create_link_use_case(
    session: AsyncSession = Depends(get_async_session),
):
    uow = get_link_unit_of_work(session=session)
    return PostgreSQLCreateLinkUseCase(uow=uow)