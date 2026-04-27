import re
from typing import List
from datetime import datetime, UTC

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import  select, update
from sqlalchemy.exc import IntegrityError


from domain.user.exceptions import UserNotFoundError, UserNotFound
from domain.user.repository import AbstractUserRepository
from domain.user.models import UserDTO, CreateUserDTO, UserUpdateDTO
from infrastructure.databases.postgresql.models.user import User as UserModel
from .exceptions import UserIsExist


class PostgreSQLUserRepository(AbstractUserRepository):
    def __init__(self, session: AsyncSession):
        self._session = session


    async def create(self, dto: CreateUserDTO) -> UserDTO:
        created_at = datetime.now(UTC)
        is_active = True

        db_user = UserModel(
            username=dto.username,
            email=dto.email,
            password=dto.password,
            created_at=created_at,
            is_active=is_active,
        )

        self._session.add(db_user)
        try:
            await self._session.flush()
        except IntegrityError as e:
            pattern = r'Key \((.*?)\)=\((.*?)\)'
            match = re.search(pattern, str(e))
            columns = [col.strip() for col in match.group(1).split(',')]
            values = [val.strip() for val in match.group(2).split(',')]

            raise UserIsExist(field=columns[0], value=values[0])

        return self._to_domain(db_user)


    async def get(self, user_id: int) -> UserDTO:
        user_db = await self._session.get(UserModel, user_id)

        if user_db is None:
            raise UserNotFound()

        return self._to_domain(user_db)

    async def update(self, user_id: int, dto: UserUpdateDTO) -> UserDTO:
        pass

    async def delete(self, user_id: int) -> None:
        pass

    async def list(self, limit: int = 100, offset: int = 0) -> List[UserDTO]:
        pass


    @staticmethod
    def _to_domain(user: UserModel) -> UserDTO:
        return UserDTO(
            id=user.id,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            created_at=user.created_at,
        )