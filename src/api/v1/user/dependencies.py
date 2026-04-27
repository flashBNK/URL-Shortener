from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.databases.postgresql.session import get_async_session
from infrastructure.di.injection import build_user_unit_of_work
from infrastructure.repositories.postgresql.user.uow import PostgreSQLUserUnitOfWork

from usecases.user.create.implementation import PostgreSQLCreateLinkUseCase
from usecases.user.get.implementation import PostgreSQLGetLinkUseCase


def get_user_unit_of_work(
    session: AsyncSession = Depends(get_async_session)
) -> PostgreSQLUserUnitOfWork:
    return build_user_unit_of_work(session)


def create_user_use_case(
    session: AsyncSession = Depends(get_async_session)
):
    uow = get_user_unit_of_work(session=session)
    return PostgreSQLCreateLinkUseCase(uow=uow)


def get_user_use_case(
    session: AsyncSession = Depends(get_async_session)
):
    uow = get_user_unit_of_work(session=session)
    return PostgreSQLGetLinkUseCase(uow=uow)