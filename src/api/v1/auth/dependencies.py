from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.databases.postgresql.session import get_async_session
from infrastructure.di.injection import build_token_unit_of_work
from infrastructure.repositories.postgresql.token.uow import PostgreSQLTokenUnitOfWork
from usecases.token.create.implementation import PostgreSQLCreateTokenUseCase
from usecases.token.get_user_by_token.implementation import PostgreSQLGetUserByTokenUseCase
from usecases.token.logout.implementation import PostgreSQLLogoutTokenUseCase
from usecases.token.refresh.implementation import PostgreSQLRefreshTokenUseCase
from usecases.token.revoke_all_tokens.implementation import PostgreSQLRevokeAllTokensUseCase


def get_token_unit_of_work(
    session: AsyncSession = Depends(get_async_session)
) -> PostgreSQLTokenUnitOfWork:
    return build_token_unit_of_work(session)


def create_token_use_case(
    session: AsyncSession = Depends(get_async_session),
):
    uow = get_token_unit_of_work(session=session)
    return PostgreSQLCreateTokenUseCase(uow=uow)

def refresh_token_use_case(
    session: AsyncSession = Depends(get_async_session),
):
    uow = get_token_unit_of_work(session=session)
    return PostgreSQLRefreshTokenUseCase(uow=uow)

def get_user_by_token_use_case(
    session: AsyncSession = Depends(get_async_session)
):
    uow = get_token_unit_of_work(session=session)
    return PostgreSQLGetUserByTokenUseCase(uow=uow)

def logout_token_use_case(
    session: AsyncSession = Depends(get_async_session)
):
    uow = get_token_unit_of_work(session=session)
    return PostgreSQLLogoutTokenUseCase(uow=uow)

def revoke_all_tokens_use_case(
    session: AsyncSession = Depends(get_async_session)
):
    uow = get_token_unit_of_work(session=session)
    return PostgreSQLRevokeAllTokensUseCase(uow=uow)