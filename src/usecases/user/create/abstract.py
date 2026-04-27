from abc import ABC, abstractmethod

from domain.user.models import CreateUserDTO, UserDTO

class AbstractCreateUserUseCase(ABC):
    @abstractmethod
    async def execute(self, dto: CreateUserDTO) -> UserDTO:
        ...
