from abc import ABC, abstractmethod

from domain.user.models import UserDTO, UserUpdateDTO


class AbstractUpdateUserUseCase(ABC):
    @abstractmethod
    async def execute(self, user_id: int, dto: UserUpdateDTO) -> UserDTO:
        ...
