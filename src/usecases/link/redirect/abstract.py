from abc import ABC, abstractmethod

from domain.link.models import LinkDTO

class AbstractRedirectLinkUseCase(ABC):
    @abstractmethod
    async def execute(self, short_url: str, user_agent: str, ip: str) -> LinkDTO:
        ...