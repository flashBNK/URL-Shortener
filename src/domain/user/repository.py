from abc import ABC, abstractmethod

from domain.token.models import LoginUserDTO

from ..repositories.abstract import AbstractRepository
from .exceptions import UserNotFound
from .models import ChangePasswordDTO, CreateUserDTO, PasswordDTO, UserDTO, UserUpdateDTO


class AbstractUserRepository(AbstractRepository[UserDTO, int, CreateUserDTO, UserUpdateDTO], ABC):
    """
    Контракт репозитория для User.
    """

    @abstractmethod
    def get_by_credentials(self, dto: LoginUserDTO) -> UserDTO:
        raise UserNotFound

    @abstractmethod
    def change_password(self, user_id: int, dto: ChangePasswordDTO) -> None:
        raise UserNotFound

    @abstractmethod
    def delete_and_check_password(self, user_id: int, dto: PasswordDTO) -> None:
        raise UserNotFound

    # @abstractmethod
    # async def find_by_filters(self, user_filters: UserFilterDTO) -> List[UserDTO]:
    #     raise UserNotFound