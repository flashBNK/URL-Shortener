from abc import ABC, abstractmethod

from domain.token.models import RefreshTokenDTO, TokenDTO


class AbstractRefreshTokenUseCase(ABC):
    @abstractmethod
    async def execute(self, dto: RefreshTokenDTO) -> TokenDTO:
        ...