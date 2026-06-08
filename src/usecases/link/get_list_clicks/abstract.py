from abc import ABC, abstractmethod
from typing import List

from domain.link.models import LinkClickDTO
from domain.pagination.paginate import PaginationDTO


class AbstractGetLinkClicksUseCase(ABC):
    @abstractmethod
    async def execute(self, short_url: str, user_id: int, paginate: PaginationDTO | None) -> tuple[List[LinkClickDTO], int]:
        ...