from abc import ABC, abstractmethod

class AbstractFindByShortUrlLinkUseCase(ABC):
    @abstractmethod
    async def execute(self, short_url: str):
        ...