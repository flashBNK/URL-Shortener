from abc import ABC, abstractmethod
from typing import List

from ..repositories.abstract import AbstractRepository
from .models import LinkDTO, CreateLinkDTO, UpdateLinkDTO
from .exceptions import LinkNotFoundError


class AbstractLinkRepository(AbstractRepository[LinkDTO, int, CreateLinkDTO, UpdateLinkDTO], ABC):
    """
    Контракт репозитория для Link.
    """

    @abstractmethod
    def find_by_short_url(self, name: str) -> LinkDTO:
        raise LinkNotFoundError

    # @abstractmethod
    # async def find_by_filters(self, link_filters: LinkFilterDTO) -> List[LinkDTO]:
    #     raise LinkNotFoundError