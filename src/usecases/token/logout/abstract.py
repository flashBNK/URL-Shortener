from abc import ABC, abstractmethod

class AbstractLogoutTokenUseCase(ABC):
    @abstractmethod
    async def execute(self, user_id: int) -> None:
        ...
