from abc import ABC, abstractmethod
from domain.link.models import LinkDTO, UpdateLinkDTO



class AbstractUpdateLinkUseCase(ABC):
    @abstractmethod
    async def execute(self, user_id: int, short_url: str, dto: UpdateLinkDTO) -> LinkDTO:
        ...