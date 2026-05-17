from typing import List
from abc import ABC, abstractmethod

from domain.link.models import LinkDTO
from domain.pydantic.paginate import PaginationDTO


class AbstractGetMeLinksUseCase(ABC):
    @abstractmethod
    async def execute(self, user_id: int, paginate: PaginationDTO | None) -> tuple[List[LinkDTO], int]:
        ...