from abc import ABC, abstractmethod

class AbstractGetLinkUseCase(ABC):
    @abstractmethod
    async def execute(self, short_url: str):
        ...