from abc import ABC, abstractmethod

from domain.token.models import LoginUserDTO, TokenDTO

class AbstractCreateTokenUseCase(ABC):
    @abstractmethod
    async def execute(self, dto: LoginUserDTO) -> TokenDTO:
        ...