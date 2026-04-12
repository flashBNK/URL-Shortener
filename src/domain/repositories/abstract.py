from abc import ABC, abstractmethod
from typing import TypeVar, Generic, List


TEntity = TypeVar("TEntity")
TId = TypeVar("TId")
TCreateDTO = TypeVar("TCreateDTO")
TUpdateDTO = TypeVar("TUpdateDTO")

class AbstractRepository(ABC, Generic[TEntity, TId, TCreateDTO, TUpdateDTO]):
    """
    Общий абстрактный репозиторий.
    """

    @abstractmethod
    async def get(self, entity_id: TId) -> TEntity:
        raise NotImplementedError

    @abstractmethod
    async def list(self, limit: int = 100, offset: int = 0) -> List[TEntity]:
        raise NotImplementedError

    @abstractmethod
    async def create(self, dto: TCreateDTO) -> TEntity:
        raise NotImplementedError

    @abstractmethod
    async def update(self, entity_id: TId, dto: TUpdateDTO) -> TEntity:
        raise NotImplementedError

    @abstractmethod
    async def delete(self, entity_id: TId) -> None:
        raise NotImplementedError