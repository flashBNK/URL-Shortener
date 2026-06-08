from domain.token.models import RefreshTokenDTO, TokenDTO

from .abstract import AbstractRefreshTokenUseCase


class PostgreSQLRefreshTokenUseCase(AbstractRefreshTokenUseCase):
    def __init__(self, uow):
        self._uow = uow

    async def execute(self, dto: RefreshTokenDTO) -> TokenDTO:

        async with self._uow as uow:
            token = await uow.repository.refresh(dto=dto)

        return token