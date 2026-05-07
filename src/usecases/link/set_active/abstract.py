from abc import ABC, abstractmethod
from domain.link.models import LinkDTO



class AbstractSetActiveLinkUseCase(ABC):
    @abstractmethod
    async def execute(self, user_id: int, short_url: str, is_active: bool) -> LinkDTO:
        ...