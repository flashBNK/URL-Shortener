from .abstract import AbstractLogoutTokenUseCase


class PostgreSQLLogoutTokenUseCase(AbstractLogoutTokenUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, user_id: int) -> None:
        async with self._uow as uow:
            await uow.repository.delete_by_user_id(user_id)