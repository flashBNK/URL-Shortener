from abc import ABC, abstractmethod
from typing import List

from domain.link.models import LinkDTO
from domain.pagination.paginate import PaginationDTO


class AbstractGetMeLinksUseCase(ABC):
    @abstractmethod
    async def execute(self, user_id: int, paginate: PaginationDTO | None) -> tuple[List[LinkDTO], int]:
        ...