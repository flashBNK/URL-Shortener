from abc import ABC, abstractmethod

from domain.user.models import ChangePasswordDTO


class AbstractChangePasswordUserUseCase(ABC):
    @abstractmethod
    async def execute(self, user_id: int, dto: ChangePasswordDTO) -> None:
        ...
