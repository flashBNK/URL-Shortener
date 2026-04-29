from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.databases.postgresql.session import get_async_session
from infrastructure.di.injection import build_token_unit_of_work
from infrastructure.repositories.postgresql.token.uow import PostgreSQLTokenUnitOfWork

from usecases.token.create.implementation import PostgreSQLCreateTokenUseCase

from services.url import UrlService
from container import Container

def get_link_unit_of_work(
    session: AsyncSession = Depends(get_async_session)
) -> PostgreSQLTokenUnitOfWork:
    return build_token_unit_of_work(session)


def create_token_use_case(
    session: AsyncSession = Depends(get_async_session),
):
    uow = get_link_unit_of_work(session=session)
    return PostgreSQLCreateTokenUseCase(uow=uow)