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

    @abstractmethod
    def redirect(self, short_url: str) -> LinkDTO:
        raise LinkNotFoundError

    @abstractmethod
    def list_me(self, user_id: int) -> List[LinkDTO]:
        raise LinkNotFoundError

    @abstractmethod
    def delete_by_user(self,  short_url: str, user_id: int) -> None:
        raise LinkNotFoundError

    @abstractmethod
    def update_by_short_url(self, short_url: str, user_id: int, dto: UpdateLinkDTO) -> LinkDTO:
        raise LinkNotFoundError

    # @abstractmethod
    # async def find_by_filters(self, link_filters: LinkFilterDTO) -> List[LinkDTO]:
    #     raise LinkNotFoundError