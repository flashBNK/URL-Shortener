from abc import ABC, abstractmethod
from typing import List

from ..repositories.abstract import AbstractRepository
from .models import UserDTO, UserUpdateDTO, CreateUserDTO
from .exceptions import UserNotFound


class AbstractUserRepository(AbstractRepository[UserDTO, int, CreateUserDTO, UserUpdateDTO], ABC):
    """
    Контракт репозитория для User.
    """

    # @abstractmethod
    # async def find_by_filters(self, user_filters: UserFilterDTO) -> List[UserDTO]:
    #     raise UserNotFound