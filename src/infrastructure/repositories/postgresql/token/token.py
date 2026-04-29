import secrets

from typing import List
from datetime import datetime, UTC, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import  select, update, delete

from domain.token.exceptions import TokenNotFoundError, TokenExpiredError
from domain.token.repository import AbstractLinkRepository
from domain.token.models import LoginUserDTO, TokenDTO, RefreshTokenDTO, UpdateTokenDTO
from domain.user.models import UserDTO
from infrastructure.databases.postgresql.models.token import Token as TokenModel
from .crypto import hash_token


class PostgreSQLTokenRepository(AbstractLinkRepository):
    def __init__(self, session: AsyncSession):
        self._session = session


    async def create(self, dto: UserDTO) -> TokenDTO:
        return await self._create_and_flush_token(dto.id)


    async def refresh(self, dto: RefreshTokenDTO) -> TokenDTO:
        hex_refresh_token = dto.refresh_token
        query = select(TokenModel).where(TokenModel.refresh_token == hex_refresh_token)
        result = await self._session.execute(query)
        token = result.scalar_one_or_none()

        if not token:
            raise TokenNotFoundError

        if token.refresh_token_expires_in < datetime.now(UTC):
            raise TokenExpiredError  # ошибка: срок действия токена доступа истёк

        new_token = await self._create_and_flush_token(token.user_id)
        return new_token


    async def get(self, token_id: int) -> TokenDTO:
        pass

    async def update(self, token_id: int, dto: UpdateTokenDTO) -> TokenDTO:
        pass

    async def delete(self, token_id: int) -> None:
        await self._session.delete(TokenModel(token_id))
        await self._session.flush()

    async def list(self, limit: int = 100, offset: int = 0) -> List[TokenDTO]:
        pass


    async def delete_by_user_id(self, user_id: int) -> None:
        stmt = delete(TokenModel).where(TokenModel.user_id == user_id)
        await self._session.execute(stmt)


    async def _create_and_flush_token(self, user_id: int) -> TokenDTO:
        access_token = secrets.token_urlsafe(56)
        refresh_token = secrets.token_urlsafe(56)

        hex_access_token = hash_token(access_token)
        hex_refresh_token = hash_token(refresh_token)

        access_token_expires_in = datetime.now(UTC) + timedelta(minutes=20)
        refresh_token_expires_in = datetime.now(UTC) + timedelta(days=5)

        token = TokenModel(
            user_id=user_id,
            access_token=hex_access_token,
            refresh_token=hex_refresh_token,
            access_token_expires_in=access_token_expires_in,
            refresh_token_expires_in=refresh_token_expires_in,
        )

        self._session.add(token)
        await self._session.flush()

        token_dto = TokenDTO(
            access_token=access_token,
            refresh_token=refresh_token,
            access_token_expires_in=access_token_expires_in,
            refresh_token_expires_in=refresh_token_expires_in,
        )

        return token_dto