from sqlalchemy.ext.asyncio import AsyncSession

from .link import PostgreSQLLinkRepository


class PostgreSQLLinkUnitOfWork:
    def __init__(self, session: AsyncSession):
        self._session: AsyncSession = session # инициализируем сессию

        self.repository: PostgreSQLLinkRepository | None = None # объявляем репозиторий

    async def __aenter__(self):
        self.repository = PostgreSQLLinkRepository(self._session) # инициализируем репозиторий
        return self

    async def __aexit__(self, exc_type: Exception | None, exc_val, traceback):
        if exc_type is not None:
            await self.rollback()
        else:
            await self.commit()
        await self._session.close() # закрываем сессию
        self.repository = None # зануляем репозиторий (приводим в базовое состояние)

    async def commit(self):
        await self._session.commit() # коммитим в базу

    async def rollback(self):
        await self._session.rollback()  # возвращаем сессию в изначальное состояние (rollback)