from abc import ABC, abstractmethod
from typing import List

from ..repositories.abstract import AbstractRepository
from .models import LinkDTO, CreateLinkDTO, UpdateLinkDTO
from .exceptions import LinkNotFoundError


class AbstractLinkRepository(AbstractRepository[LinkDTO, int, CreateLinkDTO, UpdateLinkDTO], ABC):
    """
    Контракт репозитория для Link.
    """

    # @abstractmethod
    # def find_by_name(self, name: str) -> Author:
    #     raise LinkNotFoundError
    #
    # @abstractmethod
    # async def find_by_filters(self, author_filters: LinkFilterDTO) -> List[LinkDTO]:
    #     raise LinkNotFoundError