from abc import ABC, abstractmethod

from domain.link.models import GroupByCountryLinkDTO

class AbstractGroupByCountryLinkUseCase(ABC):
    @abstractmethod
    async def execute(self, short_url: str) -> GroupByCountryLinkDTO:
        ...