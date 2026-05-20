from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from infrastructure.databases.postgresql.session import get_async_session
from infrastructure.di.injection import build_user_unit_of_work
from infrastructure.repositories.postgresql.user.uow import PostgreSQLUserUnitOfWork
from domain.user.models import UserDTO
from domain.token.exceptions import TokenExpiredError, TokenNotFoundError
from api.v1.auth.dependencies import get_user_by_token_use_case

from usecases.user.change_password.implementation import PostgreSQLChangePasswordUserUseCase
from usecases.user.create.implementation import PostgreSQLCreateUserUseCase
from usecases.user.delete.implementation import PostgreSQLDeleteUserUseCase
from usecases.user.get.implementation import PostgreSQLGetUserUseCase
from usecases.user.update.implementation import PostgreSQLUpdateUserUseCase


security_scheme = HTTPBearer(auto_error=False, scheme_name="Bearer")


def get_user_unit_of_work(
    session: AsyncSession = Depends(get_async_session)
) -> PostgreSQLUserUnitOfWork:
    return build_user_unit_of_work(session)


def create_user_use_case(
    session: AsyncSession = Depends(get_async_session)
):
    uow = get_user_unit_of_work(session=session)
    return PostgreSQLCreateUserUseCase(uow=uow)


def get_user_use_case(
    session: AsyncSession = Depends(get_async_session)
):
    uow = get_user_unit_of_work(session=session)
    return PostgreSQLGetUserUseCase(uow=uow)


def update_user_use_case(
    session: AsyncSession = Depends(get_async_session)
):
    uow = get_user_unit_of_work(session=session)
    return PostgreSQLUpdateUserUseCase(uow=uow)


def change_password_user_use_case(
    session: AsyncSession = Depends(get_async_session)
):
    uow = get_user_unit_of_work(session=session)
    return PostgreSQLChangePasswordUserUseCase(uow=uow)


def delete_user_use_case(
    session: AsyncSession = Depends(get_async_session)
):
    uow = get_user_unit_of_work(session=session)
    return PostgreSQLDeleteUserUseCase(uow=uow)


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    usecase = Depends(get_user_by_token_use_case)
) -> UserDTO | None:
    token = credentials.credentials if credentials else None
    if not token:
        return None
    try:
        user = await usecase.execute(access_token=token)
    except TokenExpiredError:
        return None
    except TokenNotFoundError:
        return None
    return user