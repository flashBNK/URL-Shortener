from abc import ABC, abstractmethod

from domain.user.models import PasswordDTO


class AbstractDeleteUserUseCase(ABC):
    @abstractmethod
    async def execute(self, user_id: int, dto: PasswordDTO) -> None:
        ...
