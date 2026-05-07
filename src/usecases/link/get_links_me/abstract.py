from typing import List
from abc import ABC, abstractmethod

from domain.link.models import LinkDTO

class AbstractGetMeLinksUseCase(ABC):
    @abstractmethod
    async def execute(self, user_id: int) -> List[LinkDTO]:
        ...