from abc import ABC, abstractmethod

class AbstractRevokeAllTokensUseCase(ABC):
    @abstractmethod
    async def execute(self, user_id: int) -> None:
        ...
