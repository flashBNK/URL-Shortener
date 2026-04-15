from domain.link.models import CreateLinkDTO, LinkDTO
from domain.link.exceptions import LinkIsExist, LinkAlreadyExist
from utils.short_code import generate_short_code

from .abstract import AbstractCreateLinkUseCase


class PostgreSQLCreateLinkUseCase(AbstractCreateLinkUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, dto: CreateLinkDTO) -> LinkDTO:

        for _ in range(10):
            dto.short_url = generate_short_code()
            try:
                async with self._uow as uow:
                    return await uow.repository.create(dto)
            except LinkIsExist:
                continue

        raise LinkAlreadyExist