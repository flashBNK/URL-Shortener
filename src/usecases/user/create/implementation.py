from domain.user.models import CreateUserDTO, UserDTO

from .abstract import AbstractCreateUserUseCase


class PostgreSQLCreateUserUseCase(AbstractCreateUserUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, dto: CreateUserDTO) -> UserDTO:

        async with self._uow as uow:
            user = await uow.repository.create(dto)

        return user