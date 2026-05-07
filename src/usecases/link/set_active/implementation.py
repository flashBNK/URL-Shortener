from domain.link.models import LinkDTO
from .abstract import AbstractSetActiveLinkUseCase


class PostgreSQLSetActiveLinkUseCase(AbstractSetActiveLinkUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, user_id: int, short_url: str, is_active: bool) -> LinkDTO:

        async with self._uow as uow:
            link = await uow.repository.set_active(user_id=user_id, short_url=short_url, is_active=is_active)

        return link