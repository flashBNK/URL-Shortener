from domain.user.exceptions import UserNotFoundError
from domain.user.models import UserDTO, UserUpdateDTO, CreateUserDTO
from .abstract import AbstractGetUserUseCase


class PostgreSQLGetLinkUseCase(AbstractGetUserUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, user_id: int) -> UserDTO:
        async with self._uow as uow:
            user = await uow.repository.get(user_id)

        return user