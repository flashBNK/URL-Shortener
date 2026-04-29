from abc import ABC, abstractmethod

from ..repositories.abstract import AbstractRepository
from .models import LoginUserDTO, TokenDTO, CreateTokenDTO, UpdateTokenDTO, RefreshTokenDTO
from domain.user.models import UserDTO
from .exceptions import TokenNotFoundError


class AbstractLinkRepository(AbstractRepository[TokenDTO, int, CreateTokenDTO, UpdateTokenDTO], ABC):
    """
    Контракт репозитория для Token.
    """

    @abstractmethod
    def refresh(self, dto: RefreshTokenDTO) -> TokenDTO:
        raise TokenNotFoundError

    @abstractmethod
    def delete_by_user_id(self, user_id: int) -> None:
        raise TokenNotFoundError

    def create(self, dto: UserDTO) -> TokenDTO:
        raise TokenNotFoundError