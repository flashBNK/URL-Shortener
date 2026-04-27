from domain.user.models import UserDTO, UserUpdateDTO, CreateUserDTO
from .abstract import AbstractCreateUserUseCase


class PostgreSQLCreateLinkUseCase(AbstractCreateUserUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, dto: CreateUserDTO) -> UserDTO:

        async with self._uow as uow:
            user = await uow.repository.create(dto)

        return user