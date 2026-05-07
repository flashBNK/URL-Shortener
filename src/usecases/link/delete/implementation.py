from .abstract import AbstractDeleteLinkUseCase


class PostgreSQLDeleteLinkUseCase(AbstractDeleteLinkUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, user_id: int, short_url: str):

        async with self._uow as uow:
            await uow.repository.delete_by_user(user_id=user_id, short_url=short_url)