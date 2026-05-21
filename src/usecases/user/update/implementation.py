from domain.user.models import UserDTO, UserUpdateDTO
from .abstract import AbstractUpdateUserUseCase


class PostgreSQLUpdateUserUseCase(AbstractUpdateUserUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, user_id: int, dto: UserUpdateDTO) -> UserDTO:
        async with self._uow as uow:
            user = await uow.repository.update(user_id, dto)

        return user