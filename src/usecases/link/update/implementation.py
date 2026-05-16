from domain.link.models import LinkDTO, UpdateLinkDTO
from .abstract import AbstractUpdateLinkUseCase


class PostgreSQLUpdateLinkUseCase(AbstractUpdateLinkUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, user_id: int, short_url: str, dto: UpdateLinkDTO) -> LinkDTO:

        async with self._uow as uow:
            link = await uow.repository.update_by_short_url(user_id=user_id, short_url=short_url, dto=dto)

        return link