from domain.user.models import PasswordDTO

from .abstract import AbstractDeleteUserUseCase


class PostgreSQLDeleteUserUseCase(AbstractDeleteUserUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, user_id: int, dto: PasswordDTO) -> None:
        async with self._uow as uow:
            await uow.repository.delete_and_check_password(user_id, dto)