from domain.token.models import TokenDTO, LoginUserDTO
from .abstract import AbstractCreateTokenUseCase


class PostgreSQLCreateTokenUseCase(AbstractCreateTokenUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, dto: LoginUserDTO) -> TokenDTO:

        async with self._uow as uow:
            user = await uow.user_repository.get_by_credentials(dto)
            await uow.repository.delete_by_user_id(user.id)
            token = await uow.repository.create(dto=user)

        return token