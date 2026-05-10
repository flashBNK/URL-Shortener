from abc import ABC, abstractmethod

from ..repositories.abstract import AbstractRepository
from .models import LoginUserDTO, TokenDTO, CreateTokenDTO, UpdateTokenDTO, RefreshTokenDTO
from domain.user.models import UserDTO
from .exceptions import TokenNotFoundError


class AbstractTokenRepository(AbstractRepository[TokenDTO, int, CreateTokenDTO, UpdateTokenDTO], ABC):
    """
    Контракт репозитория для Token.
    """

    @abstractmethod
    def refresh(self, dto: RefreshTokenDTO) -> TokenDTO:
        raise TokenNotFoundError

    @abstractmethod
    def delete_by_user_id(self, user_id: int) -> None:
        raise TokenNotFoundError

    @abstractmethod
    def create(self, dto: UserDTO) -> TokenDTO:
        raise TokenNotFoundError

    @abstractmethod
    def get_user(self, access_token: str) -> UserDTO:
        raise TokenNotFoundError

    @abstractmethod
    def get_token_by_user_id(self, user_id: int) -> TokenDTO:
        raise TokenNotFoundError