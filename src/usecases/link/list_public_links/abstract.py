from abc import ABC, abstractmethod
from typing import List

from domain.link.models import LinkDTO
from domain.pagination.paginate import PaginationDTO


class AbstractListPublicLinksUseCase(ABC):
    @abstractmethod
    async def execute(self, paginate: PaginationDTO) -> tuple[List[LinkDTO], int]:
        ...