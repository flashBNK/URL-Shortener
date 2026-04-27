from abc import ABC, abstractmethod

from domain.user.models import UserDTO

class AbstractGetUserUseCase(ABC):
    @abstractmethod
    async def execute(self, user_id: int) -> UserDTO:
        ...
