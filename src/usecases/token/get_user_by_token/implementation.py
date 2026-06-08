from domain.user.models import UserDTO

from .abstract import AbstractGetUserByTokenUseCase


class PostgreSQLGetUserByTokenUseCase(AbstractGetUserByTokenUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, access_token: str) -> UserDTO:
        async with self._uow as uow:
            user = await uow.repository.get_user(access_token)

        return user