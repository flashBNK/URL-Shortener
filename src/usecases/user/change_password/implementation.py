from domain.user.models import ChangePasswordDTO
from .abstract import AbstractChangePasswordUserUseCase


class PostgreSQLChangePasswordUserUseCase(AbstractChangePasswordUserUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, user_id: int, dto: ChangePasswordDTO) -> None:
        async with self._uow as uow:
            await uow.repository.change_password(user_id, dto)