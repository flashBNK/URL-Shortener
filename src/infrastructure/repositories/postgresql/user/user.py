import re
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.exc import IntegrityError

from domain.token.models import LoginUserDTO
from domain.user.exceptions import UserNotFound
from domain.user.repository import AbstractUserRepository
from domain.user.models import UserDTO, CreateUserDTO, UserUpdateDTO
from infrastructure.databases.postgresql.models.user import User as UserModel
from .exceptions import UserIsExist
from api.v1.user.crypto import context


class PostgreSQLUserRepository(AbstractUserRepository):
    def __init__(self, session: AsyncSession):
        self._session = session


    async def create(self, dto: CreateUserDTO) -> UserDTO:
        db_user = UserModel(
            username=dto.username,
            email=dto.email,
            password=dto.password,
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


    async def get_by_credentials(self, dto: LoginUserDTO) -> UserDTO:
        query = select(UserModel).where(and_(UserModel.username == dto.username))
        result = await self._session.execute(query)
        user = result.scalar_one_or_none()

        if user is None:
            raise UserNotFound()

        verify = context.verify(dto.password, user.password)

        if verify:
            return self._to_domain(user)
        raise UserNotFound()

    @staticmethod
    def _to_domain(user: UserModel) -> UserDTO:
        return UserDTO(
            id=user.id,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            created_at=user.created_at,
        )