from sqlalchemy.ext.asyncio import AsyncSession

from .token import PostgreSQLTokenRepository
from ..user.user import PostgreSQLUserRepository


class PostgreSQLTokenUnitOfWork:
    def __init__(self, session: AsyncSession):
        self._session: AsyncSession = session # инициализируем сессию

        self.repository: PostgreSQLTokenRepository | None = None # объявляем репозиторий
        self.user_repository: PostgreSQLUserRepository | None = None

    async def __aenter__(self):
        self.repository = PostgreSQLTokenRepository(self._session) # инициализируем репозиторий
        self.user_repository = PostgreSQLUserRepository(self._session)  # инициализируем репозиторий
        return self

    async def __aexit__(self, exc_type: Exception | None, exc_val, traceback):
        if exc_type is not None:
            await self.rollback()
        else:
            await self.commit()
        await self._session.close() # закрываем сессию
        self.repository = None # зануляем репозиторий (приводим в базовое состояние)
        self.user_repository = None  # зануляем репозиторий (приводим в базовое состояние)

    async def commit(self):
        await self._session.commit() # коммитим в базу

    async def rollback(self):
        await self._session.rollback()  # возвращаем сессию в изначальное состояние (rollback)