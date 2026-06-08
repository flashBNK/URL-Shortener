from abc import ABC, abstractmethod


class AbstractDeleteLinkUseCase(ABC):
    @abstractmethod
    async def execute(self, user_id: int, short_url: str):
        ...