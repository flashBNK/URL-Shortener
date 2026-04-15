from abc import ABC, abstractmethod

from domain.link.models import CreateLinkDTO, LinkDTO

class AbstractCreateLinkUseCase(ABC):
    @abstractmethod
    async def execute(self, dto: CreateLinkDTO) -> LinkDTO:
        ...
