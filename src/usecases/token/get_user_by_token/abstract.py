from abc import ABC, abstractmethod

from domain.user.models import UserDTO

class AbstractGetUserByTokenUseCase(ABC):
    @abstractmethod
    async def execute(self, access_token: str) -> UserDTO:
        ...
