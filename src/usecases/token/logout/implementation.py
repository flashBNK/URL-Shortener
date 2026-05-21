from .abstract import AbstractLogoutTokenUseCase


class PostgreSQLLogoutTokenUseCase(AbstractLogoutTokenUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, access_token: str) -> None:
        async with self._uow as uow:
            await uow.repository.delete_by_access_token(access_token)