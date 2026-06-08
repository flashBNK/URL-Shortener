from abc import ABC, abstractmethod


class AbstractLogoutTokenUseCase(ABC):
    @abstractmethod
    async def execute(self, access_token: str) -> None:
        ...
